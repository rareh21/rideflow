import { api } from "./api";

export type DriverLocation = {
    latitude: number | null;
    longitude: number | null;
    heading: number | null;
    speedKmh: number | null;
    accuracyM: number | null;
    updatedAt: string | null;
};

export type UpdateDriverLocationInput = {
    latitude: number;
    longitude: number;
    heading?: number;
    speedKmh?: number;
    accuracyM?: number;
};

export function updateDriverLocation(
    input: UpdateDriverLocationInput,
): Promise<DriverLocation> {
    return api<DriverLocation>("/drivers/me/location", {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export function getRideDriverLocation(
    rideId: string,
): Promise<DriverLocation> {
    return api<DriverLocation>(`/rides/${rideId}/driver-location`, {
        method: "GET",
    });
}
