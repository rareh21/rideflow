import { api } from "./api";

/** A Google Places autocomplete prediction. */
export type LocationSuggestion = {
    placeId: string;
    /** Short primary name, e.g. "Madhapur". */
    label: string;
    /** Full human-readable string, e.g. "Madhapur, Hyderabad, Telangana, India". */
    description: string;
};

/** A RideFlow Location record returned after geocoding a place. */
export type ResolvedLocation = {
    id: string;
    label: string;
    latitude: string;
    longitude: string;
    createdAt: string;
};

/**
 * Search for locations matching `query` (min 2 chars).
 * Proxies through backend which tries Google Places then falls back to database.
 */
export async function searchLocations(
    query: string,
    signal?: AbortSignal,
): Promise<LocationSuggestion[]> {
    if (query.trim().length < 2) {
        return [];
    }

    const params = new URLSearchParams({ q: query.trim() });

    return api<LocationSuggestion[]>(
        `/locations/autocomplete?${params.toString()}`,
        signal ? { signal } : undefined,
    );
}

/**
 * Resolve a Google Place ID (or DB place ID) to a database Location record.
 */
export async function resolveLocation(
    placeId: string,
    label: string,
): Promise<ResolvedLocation> {
    return api<ResolvedLocation>("/locations/resolve", {
        method: "POST",
        body: JSON.stringify({ placeId, label }),
    });
}

/**
 * Auto-detect current location: reverse geocodes latitude/longitude coordinates
 * into a database Location record.
 */
export async function reverseGeocodeLocation(
    latitude: number,
    longitude: number,
): Promise<ResolvedLocation> {
    return api<ResolvedLocation>("/locations/reverse-geocode", {
        method: "POST",
        body: JSON.stringify({ latitude, longitude }),
    });
}
