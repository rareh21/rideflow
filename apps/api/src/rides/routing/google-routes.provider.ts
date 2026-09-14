import {
    Injectable,
    Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { LatLng, RoutePreview, RoutingProvider } from "./routing.types";
import { haversineDistanceKm } from "../utils/location-calculator";

interface GoogleRoute {
    distanceMeters?: number;
    duration?: string;
    polyline?: {
        encodedPolyline?: string;
    };
}

interface GoogleRoutesResponse {
    routes?: GoogleRoute[];
}

interface GoogleDirectionsLegacyResponse {
    status: string;
    routes?: Array<{
        overview_polyline?: {
            points?: string;
        };
        legs?: Array<{
            distance?: { value: number };
            duration?: { value: number };
        }>;
    }>;
}

const GOOGLE_ROUTES_ENDPOINT =
    "https://routes.googleapis.com/directions/v2:computeRoutes";

const GOOGLE_DIRECTIONS_LEGACY_ENDPOINT =
    "https://maps.googleapis.com/maps/api/directions/json";

@Injectable()
export class GoogleRoutesProvider implements RoutingProvider {
    private readonly logger = new Logger(GoogleRoutesProvider.name);

    constructor(private readonly config: ConfigService) {}

    async getRoute(
        origin: LatLng,
        destination: LatLng,
    ): Promise<RoutePreview> {
        const apiKey = this.config.get<string>("GOOGLE_MAPS_API_KEY");

        if (!apiKey) {
            this.logger.warn(
                "GOOGLE_MAPS_API_KEY is not configured — using fallback road calculation",
            );
            return this.getFallbackRoute(origin, destination);
        }

        // Strategy 1: Try Google Routes API v2
        try {
            const requestBody = {
                origin: {
                    location: {
                        latLng: {
                            latitude: origin.latitude,
                            longitude: origin.longitude,
                        },
                    },
                },
                destination: {
                    location: {
                        latLng: {
                            latitude: destination.latitude,
                            longitude: destination.longitude,
                        },
                    },
                },
                travelMode: "DRIVE",
                routingPreference: "TRAFFIC_AWARE",
                computeAlternativeRoutes: false,
                units: "METRIC",
            };

            const response = await fetch(GOOGLE_ROUTES_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": apiKey,
                    "X-Goog-FieldMask":
                        "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                const data = (await response.json()) as GoogleRoutesResponse;
                const routes = data?.routes;

                if (routes && routes.length > 0) {
                    const route = routes[0];
                    const distanceMeters = route.distanceMeters;
                    const durationStr = route.duration;

                    if (
                        typeof distanceMeters === "number" &&
                        typeof durationStr === "string"
                    ) {
                        const durationSeconds = parseInt(
                            durationStr.replace("s", ""),
                            10,
                        );

                        if (!isNaN(durationSeconds)) {
                            return {
                                distanceKm:
                                    Math.round((distanceMeters / 1000) * 10) / 10,
                                durationMinutes: Math.max(
                                    1,
                                    Math.ceil(durationSeconds / 60),
                                ),
                                encodedPolyline: route.polyline?.encodedPolyline,
                            };
                        }
                    }
                }
            }
        } catch (err) {
            this.logger.warn(
                `Google Routes API v2 error: ${err instanceof Error ? err.message : String(err)}. Trying legacy Directions API.`,
            );
        }

        // Strategy 2: Try standard Google Directions API (Legacy)
        try {
            const params = new URLSearchParams({
                origin: `${origin.latitude},${origin.longitude}`,
                destination: `${destination.latitude},${destination.longitude}`,
                key: apiKey,
                mode: "driving",
            });

            const response = await fetch(
                `${GOOGLE_DIRECTIONS_LEGACY_ENDPOINT}?${params.toString()}`,
            );

            if (response.ok) {
                const data =
                    (await response.json()) as GoogleDirectionsLegacyResponse;

                if (
                    data.status === "OK" &&
                    data.routes &&
                    data.routes.length > 0
                ) {
                    const route = data.routes[0];
                    const leg = route.legs?.[0];

                    if (leg?.distance?.value && leg?.duration?.value) {
                        return {
                            distanceKm:
                                Math.round((leg.distance.value / 1000) * 10) / 10,
                            durationMinutes: Math.max(
                                1,
                                Math.ceil(leg.duration.value / 60),
                            ),
                            encodedPolyline: route.overview_polyline?.points,
                        };
                    }
                }
            }
        } catch (err) {
            this.logger.warn(
                `Google Directions Legacy API error: ${err instanceof Error ? err.message : String(err)}. Using fallback road calculation.`,
            );
        }

        // Strategy 3: Try OSRM Free Routing API (Real road distance, duration & polyline)
        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=polyline`;
            const response = await fetch(osrmUrl);

            if (response.ok) {
                const data = (await response.json()) as {
                    code?: string;
                    routes?: Array<{
                        distance?: number;
                        duration?: number;
                        geometry?: string;
                    }>;
                };

                if (data?.code === "Ok" && data?.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    if (
                        typeof route.distance === "number" &&
                        typeof route.duration === "number"
                    ) {
                        return {
                            distanceKm:
                                Math.max(0.1, Math.round((route.distance / 1000) * 10) / 10),
                            durationMinutes: Math.max(
                                1,
                                Math.ceil(route.duration / 60),
                            ),
                            encodedPolyline: route.geometry,
                        };
                    }
                }
            }
        } catch (err) {
            this.logger.warn(
                `OSRM Routing API error: ${err instanceof Error ? err.message : String(err)}. Using fallback road calculation.`,
            );
        }

        // Strategy 4: Calculated Road Fallback
        return this.getFallbackRoute(origin, destination);
    }

    private getFallbackRoute(origin: LatLng, destination: LatLng): RoutePreview {
        const straightKm = haversineDistanceKm(
            origin.latitude,
            origin.longitude,
            destination.latitude,
            destination.longitude,
        );

        const roadKm = Math.max(0.5, Math.round(straightKm * 1.3 * 10) / 10);
        const durationMinutes = Math.max(1, Math.ceil((roadKm / 25) * 60));

        return {
            distanceKm: roadKm,
            durationMinutes,
        };
    }
}
