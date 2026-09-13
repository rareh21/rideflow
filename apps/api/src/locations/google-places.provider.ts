import {
    Injectable,
    InternalServerErrorException,
    Logger,
    BadGatewayException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type PlacePrediction = {
    placeId: string;
    label: string;
    description: string;
};

export type PlaceGeometry = {
    latitude: number;
    longitude: number;
    formattedAddress: string;
};

interface GoogleAutocompleteResponse {
    status: string;
    error_message?: string;
    predictions: Array<{
        place_id: string;
        structured_formatting?: {
            main_text?: string;
        };
        description: string;
    }>;
}

interface GooglePlaceDetailsResponse {
    status: string;
    error_message?: string;
    result?: {
        geometry?: {
            location?: {
                lat: number;
                lng: number;
            };
        };
        formatted_address?: string;
        name?: string;
    };
}

interface GoogleGeocodeResponse {
    status: string;
    error_message?: string;
    results?: Array<{
        formatted_address: string;
        address_components?: Array<{
            long_name: string;
            types: string[];
        }>;
    }>;
}

const AUTOCOMPLETE_URL =
    "https://maps.googleapis.com/maps/api/place/autocomplete/json";

const DETAILS_URL =
    "https://maps.googleapis.com/maps/api/place/details/json";

const GEOCODE_URL =
    "https://maps.googleapis.com/maps/api/geocode/json";

@Injectable()
export class GooglePlacesProvider {
    private readonly logger = new Logger(GooglePlacesProvider.name);

    constructor(private readonly config: ConfigService) {}

    /**
     * Return autocomplete predictions for a search query.
     * Tries Google Places API first. If Google API key is missing or Google API fails/returns 0 results,
     * seamlessly searches OpenStreetMap Nominatim so ALL real locations in India/world are searchable!
     */
    async autocomplete(query: string): Promise<PlacePrediction[]> {
        const apiKey = this.config.get<string>("GOOGLE_MAPS_API_KEY");

        if (apiKey) {
            const params = new URLSearchParams({
                input: query,
                key: apiKey,
                components: "country:in",
                language: "en",
            });

            try {
                const response = await fetch(
                    `${AUTOCOMPLETE_URL}?${params.toString()}`,
                );

                if (response.ok) {
                    const data =
                        (await response.json()) as GoogleAutocompleteResponse;

                    if (data.status === "OK" && data.predictions?.length > 0) {
                        return data.predictions.map((p) => ({
                            placeId: p.place_id,
                            label:
                                p.structured_formatting?.main_text ??
                                p.description,
                            description: p.description,
                        }));
                    }
                }
            } catch (err) {
                this.logger.warn("Google Places Autocomplete error", err);
            }
        }

        // Fallback: OpenStreetMap Nominatim search (Searches ALL real-world places, free, no key required)
        return this.searchNominatim(query);
    }

    /** Real-world location search using OpenStreetMap Nominatim. */
    async searchNominatim(query: string): Promise<PlacePrediction[]> {
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                query,
            )}&format=json&addressdetails=1&limit=8&countrycodes=in`;

            const response = await fetch(url, {
                headers: { "User-Agent": "RideFlow/1.0" },
            });

            if (response.ok) {
                const data = (await response.json()) as Array<{
                    place_id: number;
                    lat: string;
                    lon: string;
                    display_name: string;
                    name?: string;
                }>;

                return data.map((item) => {
                    const primaryName =
                        item.name || item.display_name.split(",")[0].trim();
                    return {
                        placeId: `osm:${item.place_id}:${item.lat}:${item.lon}`,
                        label: primaryName,
                        description: item.display_name,
                    };
                });
            }
        } catch (err) {
            this.logger.warn("Nominatim search failed", err);
        }
        return [];
    }

    /** Return lat/lng and formatted address for a given place ID (Google or OSM). */
    async getPlaceGeometry(placeId: string): Promise<PlaceGeometry> {
        // Handle OpenStreetMap place IDs: "osm:placeId:lat:lon"
        if (placeId.startsWith("osm:")) {
            const parts = placeId.split(":");
            if (parts.length >= 4) {
                const lat = parseFloat(parts[2]);
                const lon = parseFloat(parts[3]);
                if (!isNaN(lat) && !isNaN(lon)) {
                    return {
                        latitude: lat,
                        longitude: lon,
                        formattedAddress: "Resolved location",
                    };
                }
            }
        }

        const apiKey = this.requireApiKey();

        const params = new URLSearchParams({
            place_id: placeId,
            fields: "geometry,name,formatted_address",
            key: apiKey,
            language: "en",
        });

        let response: Response;

        try {
            response = await fetch(
                `${DETAILS_URL}?${params.toString()}`,
            );
        } catch (err) {
            this.logger.error(
                "Google Places Details network failure",
                err instanceof Error ? err.message : String(err),
            );
            throw new BadGatewayException(
                "Could not retrieve location details. Please try again.",
            );
        }

        if (!response.ok) {
            this.logger.error(
                `Google Places Details HTTP ${response.status}`,
            );
            throw new BadGatewayException(
                "Could not retrieve location details. Please try again.",
            );
        }

        let data: GooglePlaceDetailsResponse;

        try {
            data = (await response.json()) as GooglePlaceDetailsResponse;
        } catch {
            throw new InternalServerErrorException(
                "Location details returned an unexpected response.",
            );
        }

        if (data.status !== "OK" || !data.result) {
            this.logger.warn(
                `Google Places Details status: ${data.status} ${
                    data.error_message ? `(${data.error_message})` : ""
                } for placeId: ${placeId}`,
            );
            throw new BadGatewayException(
                "Could not find the selected location. Please try another.",
            );
        }

        const location = data.result.geometry?.location;

        if (
            typeof location?.lat !== "number" ||
            typeof location?.lng !== "number"
        ) {
            this.logger.error(
                "Google Places Details missing geometry for placeId: " + placeId,
            );
            throw new InternalServerErrorException(
                "Location details returned incomplete data.",
            );
        }

        return {
            latitude: location.lat,
            longitude: location.lng,
            formattedAddress:
                data.result.formatted_address ??
                data.result.name ??
                "Unknown location",
        };
    }

    /** Convert lat/lng coordinates to a human-readable address label. */
    async reverseGeocode(
        latitude: number,
        longitude: number,
    ): Promise<string | null> {
        const apiKey = this.config.get<string>("GOOGLE_MAPS_API_KEY");

        if (apiKey) {
            const params = new URLSearchParams({
                latlng: `${latitude},${longitude}`,
                key: apiKey,
                language: "en",
            });

            try {
                const response = await fetch(`${GEOCODE_URL}?${params.toString()}`);
                if (response.ok) {
                    const data = (await response.json()) as GoogleGeocodeResponse;

                    if (data.status === "OK" && data.results && data.results.length > 0) {
                        const result = data.results[0];
                        const components = result.address_components || [];

                        const sublocality = components.find(
                            (c) =>
                                c.types.includes("sublocality_level_1") ||
                                c.types.includes("neighborhood") ||
                                c.types.includes("sublocality"),
                        );

                        const city = components.find(
                            (c) =>
                                c.types.includes("locality") ||
                                c.types.includes("administrative_area_level_2"),
                        );

                        if (sublocality && city && sublocality.long_name !== city.long_name) {
                            return `${sublocality.long_name}, ${city.long_name}`;
                        }

                        if (sublocality) {
                            return sublocality.long_name;
                        }

                        return result.formatted_address;
                    }
                }
            } catch (err) {
                this.logger.warn("Google Reverse geocode failed", err);
            }
        }

        // Fallback: OpenStreetMap Nominatim reverse geocoder (free, no key required)
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
            const response = await fetch(url, {
                headers: { "User-Agent": "RideFlow/1.0" },
            });
            if (response.ok) {
                const data = (await response.json()) as {
                    address?: {
                        suburb?: string;
                        neighbourhood?: string;
                        residential?: string;
                        city_district?: string;
                        city?: string;
                        town?: string;
                    };
                };

                const addr = data.address;
                if (addr) {
                    const area =
                        addr.suburb ||
                        addr.neighbourhood ||
                        addr.residential ||
                        addr.city_district;
                    const city = addr.city || addr.town || "Hyderabad";

                    if (area && city && area !== city) {
                        return `${area}, ${city}`;
                    }
                    if (area) return area;
                    if (city) return city;
                }
            }
        } catch (err) {
            this.logger.warn("Nominatim reverse geocode failed", err);
        }

        return null;
    }

    private requireApiKey(): string {
        const apiKey = this.config.get<string>("GOOGLE_MAPS_API_KEY");

        if (!apiKey) {
            this.logger.error(
                "GOOGLE_MAPS_API_KEY is not configured",
            );
            throw new InternalServerErrorException(
                "Location services are currently unavailable.",
            );
        }

        return apiKey;
    }
}
