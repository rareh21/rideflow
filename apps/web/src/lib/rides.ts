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

/**
 * Represents the server's response to a quote request.
 *
 * All fare/distance/duration values are server-computed — the client
 * MUST NOT modify or re-calculate these before confirming the ride.
 */
export type RideQuote = {
    rideType: RideType;
    estimatedFare: number;
    estimatedDistanceKm: number;
    estimatedDurationMinutes: number;
    currency: "INR";
    pickupLocation: RideLocation;
    destinationLocation: RideLocation;
};

/**
 * Payload for POST /rides/quote.
 * Does NOT include fare, distance, or duration — the server calculates those.
 */
export type CreateRideQuotePayload = {
    pickupLocationId: string;
    destinationLocationId: string;
    rideType: RideType;
};

/**
 * Payload for POST /rides.
 * Does NOT include fare, distance, or duration — the server always recalculates
 * them server-side regardless of what the client sends.
 */
export type CreateRidePayload = {
    pickupLocationId: string;
    destinationLocationId: string;
    rideType: RideType;
    paymentMethod?: PaymentMethod;
};

/**
 * Requests a server-side fare quote without creating a Ride record.
 * Always use this result to display fare information — never calculate fares
 * in React.
 */
export async function createRideQuote(
    payload: CreateRideQuotePayload,
): Promise<RideQuote> {
    return api<RideQuote>("/rides/quote", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

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

export type RideRequest = Ride & {
    rider: {
        id: string;
        name: string;
    };
};

export async function getRideRequests() {
    return api<RideRequest[]>(
        "/rides/driver/requests",
    );
}

export async function acceptRide(
    rideId: string,
) {
    return api<{
        accepted: boolean;
        ride: Ride;
    }>(
        `/rides/${rideId}/accept`,
        {
            method: "POST",
        },
    );
}