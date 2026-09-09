"use client";

import { io } from "socket.io-client";

import type { Ride, RideStatus } from "./rides";

const REALTIME_URL =
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000";

export type RideUpdatedEvent = {
    rideId: string;
    status: RideStatus;
    ride: Ride;
};

/**
 * REST mutations remain authoritative. This subscription only reflects a committed
 * ride change sent to the authenticated rider and assigned driver private rooms.
 */
export function subscribeToRideUpdates(
    onUpdate: (event: RideUpdatedEvent) => void,
    onConnected?: () => void,
) {
    const token = sessionStorage.getItem("accessToken");

    if (!token) {
        return () => undefined;
    }

    const socket = io(REALTIME_URL, {
        auth: { token },
        transports: ["websocket"],
    });

    socket.on("ride.updated", onUpdate);

    if (onConnected) {
        socket.on("connect", onConnected);
    }

    return () => {
        socket.off("ride.updated", onUpdate);
        if (onConnected) {
            socket.off("connect", onConnected);
        }
        socket.disconnect();
    };
}

/** Drivers re-fetch their REST request queue after its membership changes. */
export function subscribeToRideRequestChanges(
    onChange: () => void,
    onConnected?: () => void,
) {
    const token = sessionStorage.getItem("accessToken");

    if (!token) {
        return () => undefined;
    }

    const socket = io(REALTIME_URL, {
        auth: { token },
        transports: ["websocket"],
    });

    socket.on("ride.requests.changed", onChange);

    if (onConnected) {
        socket.on("connect", onConnected);
    }

    return () => {
        socket.off("ride.requests.changed", onChange);
        if (onConnected) {
            socket.off("connect", onConnected);
        }
        socket.disconnect();
    };
}
