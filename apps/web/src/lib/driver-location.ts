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
 * Accessible to assigned rider or driver to fetch driver's latest location.
 * Returns null if no location has been uploaded for the driver yet.
 */
export async function getRideDriverLocation(
    rideId: string,
): Promise<DriverLocation | null> {
    return api<DriverLocation | null>(`/rides/${rideId}/driver-location`);
}
