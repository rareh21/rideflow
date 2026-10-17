import { api } from "./api";

export interface DriverLocation {
    latitude: number;
    longitude: number;
    heading: number | null;
    speedKmh: number | null;
    accuracyM: number | null;
    updatedAt: string;
}

export interface UpdateDriverLocationInput {
    latitude: number;
    longitude: number;
    heading?: number;
    speedKmh?: number;
    accuracyM?: number;
}

/**
 * Driver-only REST endpoint to update driver's current location.
 * Identity derived from authenticated JWT.
 */
export async function updateDriverLocation(
    input: UpdateDriverLocationInput,
): Promise<DriverLocation> {
    return api<DriverLocation>("/drivers/me/location", {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

/**
 * Calculate Haversine distance in km between two lat/lng coordinates.
 */
export function calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}

/**
 * Format distance in a human-friendly way (e.g. "350 m away" or "2.1 km away").
 */
export function formatDistance(distanceKm: number): string {
    if (distanceKm < 0.1) {
        return "arriving now";
    }
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m away`;
    }
    return `${distanceKm.toFixed(1)} km away`;
}
/**
 * Accessible to assigned rider or driver to fetch driver's latest location.
 * Returns null if no location has been uploaded for the driver yet.
 */
export async function getRideDriverLocation(
    rideId: string,
): Promise<DriverLocation | null> {
    return api<DriverLocation | null>(`/rides/${rideId}/driver-location`);
}
