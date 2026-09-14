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

const resolveLocationCache = new Map<
    string,
    { promise: Promise<ResolvedLocation>; timestamp: number }
>();
const RESOLVE_CACHE_TTL_MS = 30000;

/**
 * Resolve a Google Place ID (or DB place ID) to a database Location record.
 * Deduplicates in-flight calls to prevent duplicate resolve API requests.
 */
export async function resolveLocation(
    placeId: string,
    label: string,
): Promise<ResolvedLocation> {
    const key = `${placeId}:${label}`;
    const now = Date.now();
    const existing = resolveLocationCache.get(key);

    if (existing && now - existing.timestamp < RESOLVE_CACHE_TTL_MS) {
        return existing.promise;
    }

    const promise = api<ResolvedLocation>("/locations/resolve", {
        method: "POST",
        body: JSON.stringify({ placeId, label }),
    }).catch((err) => {
        resolveLocationCache.delete(key);
        throw err;
    });

    resolveLocationCache.set(key, { promise, timestamp: now });
    return promise;
}

const reverseGeocodeCache = new Map<
    string,
    { promise: Promise<ResolvedLocation>; timestamp: number }
>();
const CACHE_TTL_MS = 15000;

/**
 * Auto-detect current location: reverse geocodes latitude/longitude coordinates
 * into a database Location record. Includes automatic in-flight request
 * deduplication and short-lived caching to prevent duplicate API requests.
 */
export async function reverseGeocodeLocation(
    latitude: number,
    longitude: number,
): Promise<ResolvedLocation> {
    const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const now = Date.now();
    const existing = reverseGeocodeCache.get(key);

    if (existing && now - existing.timestamp < CACHE_TTL_MS) {
        return existing.promise;
    }

    const promise = api<ResolvedLocation>("/locations/reverse-geocode", {
        method: "POST",
        body: JSON.stringify({ latitude, longitude }),
    }).catch((err) => {
        reverseGeocodeCache.delete(key);
        throw err;
    });

    reverseGeocodeCache.set(key, { promise, timestamp: now });
    return promise;
}
