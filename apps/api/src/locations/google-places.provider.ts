import {
    Injectable,
    InternalServerErrorException,
    Logger,
    BadGatewayException,
    BadRequestException,
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

interface AddressComponent {
    long_name: string;
    types: string[];
}

interface GoogleGeocodeResponse {
    status: string;
    error_message?: string;
    results?: Array<{
        formatted_address: string;
        address_components?: AddressComponent[];
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
     * Returns autocomplete predictions for a location search query.
     * Queries Google Places API first. If unavailable, falls back to OpenStreetMap Nominatim.
     */
    async autocomplete(query: string): Promise<PlacePrediction[]> {
        const apiKey = this.config.get<string>("GOOGLE_MAPS_API_KEY");

        if (apiKey) {
            const googleResults = await this.searchGooglePlaces(query, apiKey);
            if (googleResults.length > 0) {
                return googleResults;
            }
        }

        return this.searchNominatim(query);
    }

    /** Primary Google Places Autocomplete search. */
    private async searchGooglePlaces(
        query: string,
        apiKey: string,
    ): Promise<PlacePrediction[]> {
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
            this.logger.warn("Google Places Autocomplete fetch failed", err);
        }

        return [];
    }

    /** Secondary OpenStreetMap Nominatim search for global/India coverage. */
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
            this.logger.warn("Nominatim search fetch failed", err);
        }
        return [];
    }

    /** Return lat/lng and formatted address for a given place ID (Google or OSM). */
    async getPlaceGeometry(placeId: string): Promise<PlaceGeometry> {
        if (placeId.startsWith("osm:")) {
            return this.parseOsmPlaceId(placeId);
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
            throw new BadGatewayException(
                "Could not find the selected location. Please try another.",
            );
        }

        const location = data.result.geometry?.location;

        if (
            typeof location?.lat !== "number" ||
            typeof location?.lng !== "number"
        ) {
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

    /** Parses coordinates embedded in OpenStreetMap place IDs. */
    private parseOsmPlaceId(placeId: string): PlaceGeometry {
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
        throw new BadRequestException("Invalid OpenStreetMap place ID.");
    }

    /** Convert lat/lng coordinates to a human-readable area name. */
    async reverseGeocode(
        latitude: number,
        longitude: number,
    ): Promise<string | null> {
        const apiKey = this.config.get<string>("GOOGLE_MAPS_API_KEY");

        if (apiKey) {
            const googleLabel = await this.reverseGeocodeGoogle(
                latitude,
                longitude,
                apiKey,
            );
            if (googleLabel) return googleLabel;
        }

        return this.reverseGeocodeNominatim(latitude, longitude);
    }

    private async reverseGeocodeGoogle(
        latitude: number,
        longitude: number,
        apiKey: string,
    ): Promise<string | null> {
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
                    return this.extractAreaFromAddressComponents(
                        result.address_components || [],
                        result.formatted_address,
                    );
                }
            }
        } catch (err) {
            this.logger.warn("Google Reverse geocode failed", err);
        }

        return null;
    }

    private extractAreaFromAddressComponents(
        components: AddressComponent[],
        fallbackAddress: string,
    ): string {
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

        return fallbackAddress;
    }

    private async reverseGeocodeNominatim(
        latitude: number,
        longitude: number,
    ): Promise<string | null> {
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
            this.logger.error("GOOGLE_MAPS_API_KEY is not configured");
            throw new InternalServerErrorException(
                "Location services are currently unavailable.",
            );
        }

        return apiKey;
    }
}
