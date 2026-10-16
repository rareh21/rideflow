"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
    getRideDriverLocation,
    type DriverLocation,
} from "@/lib/driver-location";
import {
    subscribeToDriverLocationUpdates,
    type DriverLocationUpdatedEvent,
} from "@/lib/ride-realtime";

export type TrackingStatus =
    | "live"
    | "recent"
    | "stale"
    | "unavailable"
    | "disconnected";

export interface UseDriverTrackingOptions {
    enabled?: boolean;
}

export function useDriverTracking(
    rideId: string,
    options: UseDriverTrackingOptions = {},
) {
    const { enabled = true } = options;

    const [location, setLocation] = useState<DriverLocation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDisconnected, setIsDisconnected] = useState(false);
    const [now, setNow] = useState<number>(Date.now());

    const rideIdRef = useRef(rideId);
    rideIdRef.current = rideId;

    const fetchLatestLocation = useCallback(async () => {
        if (!rideId) return;

        try {
            setError(null);
            const latest = await getRideDriverLocation(rideId);
            setLocation(latest);
            setIsDisconnected(false);
        } catch {
            // Gracefully handle initial location missing without setting hard error
            setLocation(null);
        } finally {
            setLoading(false);
        }
    }, [rideId]);

    // Initial fetch on mount or rideId change
    useEffect(() => {
        if (enabled && rideId) {
            setLoading(true);
            void fetchLatestLocation();
        }
    }, [enabled, rideId, fetchLatestLocation]);

    // Timer to recalculate staleness every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Socket.IO subscription
    useEffect(() => {
        if (!enabled || !rideId) {
            return;
        }

        const handleUpdate = (event: DriverLocationUpdatedEvent) => {
            if (
                event?.rideId &&
                String(event.rideId).toLowerCase() === String(rideIdRef.current).toLowerCase()
            ) {
                setLocation(event.location);
                setIsDisconnected(false);
                setError(null);
            }
        };

        const handleConnected = () => {
            setIsDisconnected(false);
            // On reconnect, refetch server state over HTTP REST
            void fetchLatestLocation();
        };

        const cleanup = subscribeToDriverLocationUpdates(
            handleUpdate,
            handleConnected,
        );

        return () => {
            cleanup();
        };
    }, [enabled, rideId, fetchLatestLocation]);

    // HTTP polling fallback — refetch every 10 s in case socket events are missed
    useEffect(() => {
        if (!enabled || !rideId) return;

        const interval = setInterval(() => {
            void fetchLatestLocation();
        }, 10_000);

        return () => clearInterval(interval);
    }, [enabled, rideId, fetchLatestLocation]);


    // Compute tracking status based on timestamp age
    let trackingStatus: TrackingStatus = "unavailable";

    if (isDisconnected) {
        trackingStatus = "disconnected";
    } else if (location) {
        const updatedMs = new Date(location.updatedAt).getTime();
        const ageSec = Math.floor((now - updatedMs) / 1000);

        if (ageSec <= 15) {
            trackingStatus = "live";
        } else if (ageSec <= 30) {
            trackingStatus = "recent";
        } else {
            trackingStatus = "stale";
        }
    }

    return {
        location,
        loading,
        error,
        trackingStatus,
        refetch: fetchLatestLocation,
    };
}
