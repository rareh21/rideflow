import { api } from "./api";
import type { RideCategory } from "@/types/ride";

export type CreateRideRequest = {
    pickupLocationId: string;
    destinationLocationId: string;
    rideType: RideCategory;
    estimatedFare: number;
    estimatedDistanceKm: number;
    estimatedDurationMinutes: number;
    paymentMethod?: "UPI" | "CARD" | "CASH";
};

export type Ride = {
    id: string;
    riderId: string;
    driverId: string | null;
    rideType: RideCategory;
    status:
    | "REQUESTED"
    | "SEARCHING_DRIVER"
    | "DRIVER_ASSIGNED"
    | "DRIVER_ARRIVING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
    estimatedFare: number | string;
    estimatedDistanceKm: number | string;
    estimatedDurationMinutes: number;
    paymentMethod: "UPI" | "CARD" | "CASH" | null;
    createdAt: string;
    updatedAt: string;
};

export async function createRide(
    payload: CreateRideRequest,
) {
    return api<Ride>("/rides", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}