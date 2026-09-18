"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getRideDriverLocation, type DriverLocation } from "@/lib/driver-location";
import { subscribeToDriverLocation } from "@/lib/ride-realtime";

export interface UseDriverTrackingOptions {
    rideId: string;
    enabled?: boolean;
    staleThresholdSeconds?: number; // Default 30s
}

export function useDriverTracking({
    rideId,
    enabled = true,
    staleThresholdSeconds = 30,
}: UseDriverTrackingOptions) {
    const [location, setLocation] = useState<DriverLocation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDisconnected, setIsDisconnected] = useState(false);
    const [timeAgoText, setTimeAgoText] = useState<string>("Location unavailable");
    const [isStale, setIsStale] = useState(false);

    const isFirstLoadRef = useRef(true);

    const fetchLocation = useCallback(async (showLoading = true) => {
        if (!rideId || !enabled) return;
        try {
            if (showLoading) setLoading(true);
            setError(null);
            const data = await getRideDriverLocation(rideId);
            setLocation(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load driver location.",
            );
        } finally {
            setLoading(false);
        }
    }, [rideId, enabled]);

    useEffect(() => {
        if (rideId && enabled) {
            void fetchLocation(isFirstLoadRef.current);
            isFirstLoadRef.current = false;
        }
    }, [rideId, enabled, fetchLocation]);

    useEffect(() => {
        if (!rideId || !enabled) return;

        const unsubscribe = subscribeToDriverLocation(
            (event) => {
                if (event.rideId === rideId) {
                    setIsDisconnected(false);
                    setError(null);
                    setLocation({
                        latitude: event.location.latitude,
                        longitude: event.location.longitude,
                        heading: event.location.heading,
                        speedKmh: event.location.speedKmh,
                        accuracyM: event.location.accuracyM,
                        updatedAt: event.location.updatedAt,
                    });
                }
            },
            // On socket reconnect: restore latest server state via REST
            () => {
                setIsDisconnected(false);
                void fetchLocation(false);
            },
        );

        return () => {
            unsubscribe();
        };
    }, [rideId, enabled, fetchLocation]);

    // Staleness and time-ago ticker
    useEffect(() => {
        if (!location?.updatedAt) {
            return;
        }

        const updateStaleness = () => {
            const updatedAtMs = new Date(location.updatedAt!).getTime();
            const nowMs = Date.now();
            const diffSeconds = Math.max(0, Math.floor((nowMs - updatedAtMs) / 1000));

            if (diffSeconds > staleThresholdSeconds) {
                setIsStale(true);
                setTimeAgoText(`Location last updated ${diffSeconds} seconds ago`);
            } else if (diffSeconds < 5) {
                setIsStale(false);
                setTimeAgoText("Updated just now");
            } else {
                setIsStale(false);
                setTimeAgoText(`Updated ${diffSeconds}s ago`);
            }
        };

        updateStaleness();
        const interval = setInterval(updateStaleness, 5000);

        return () => clearInterval(interval);
    }, [location, staleThresholdSeconds]);

    return {
        location,
        loading,
        error,
        isDisconnected,
        isStale,
        timeAgoText: location?.updatedAt ? timeAgoText : "Location unavailable",
        refetch: () => fetchLocation(true),
    };
}
