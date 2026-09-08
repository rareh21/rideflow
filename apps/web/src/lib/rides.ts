import { api } from "./api";

export type RideStatus =
    | "REQUESTED"
    | "SEARCHING_DRIVER"
    | "DRIVER_ASSIGNED"
    | "DRIVER_ARRIVING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

export type RideType =
    | "GO"
    | "PLUS"
    | "XL";

export type PaymentMethod =
    | "UPI"
    | "CARD"
    | "CASH";

export type RideLocation = {
    id: string;
    label: string;
    latitude: string;
    longitude: string;
};

export type RideVehicle = {
    make: string;
    model: string;
    year: number;
    plateNumber: string;
};

export type RideDriver = {
    id: string;
    status: string;
    user: {
        id: string;
        name: string;
    };
    vehicle: RideVehicle | null;
};

export type RideRider = {
    id: string;
    name: string;
    email: string;
};

export type Ride = {
    id: string;
    riderId: string;
    driverId: string | null;

    pickupLocationId: string;
    destinationLocationId: string;

    rideType: RideType;
    status: RideStatus;

    estimatedFare: string;
    estimatedDistanceKm: string;
    estimatedDurationMinutes: number;

    paymentMethod:
    | PaymentMethod
    | null;

    pickupLocation: RideLocation;
    destinationLocation: RideLocation;

    rider?: RideRider;
    driver: RideDriver | null;

    createdAt: string;
    updatedAt: string;
};

export type CreateRidePayload = {
    pickupLocationId: string;
    destinationLocationId: string;
    rideType: RideType;
    estimatedFare: number;
    estimatedDistanceKm: number;
    estimatedDurationMinutes: number;
    paymentMethod?: PaymentMethod;
};

export async function createRide(
    payload: CreateRidePayload,
) {
    return api<Ride>("/rides", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getMyRides() {
    return api<Ride[]>("/rides/me");
}

export async function getDriverRides() {
    return api<Ride[]>("/rides/driver");
}

export async function getRide(
    rideId: string,
) {
    return api<Ride>(
        `/rides/${rideId}`,
    );
}

export async function updateRideStatus(
    rideId: string,
    status: RideStatus,
) {
    return api<Ride>(
        `/rides/${rideId}/status`,
        {
            method: "PATCH",
            body: JSON.stringify({
                status,
            }),
        },
    );
}

export async function cancelRide(
    rideId: string,
) {
    return updateRideStatus(
        rideId,
        "CANCELLED",
    );
}