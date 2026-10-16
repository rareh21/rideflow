"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
    updateDriverLocation,
    type DriverLocation,
    type UpdateDriverLocationInput,
} from "@/lib/driver-location";

export interface UseDriverLocationOptions {
    enabled?: boolean;
    updateIntervalMs?: number;
}

export function useDriverLocation(options: UseDriverLocationOptions = {}) {
    const { enabled = false, updateIntervalMs = 3000 } = options;

    const [isSupported, setIsSupported] = useState(true);
    const [isTracking, setIsTracking] = useState(false);
    const [permissionState, setPermissionState] = useState<
        "prompt" | "granted" | "denied"
    >("prompt");
    const [error, setError] = useState<string | null>(null);
    const [lastLocation, setLastLocation] = useState<DriverLocation | null>(null);
    const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(null);

    const lastSentRef = useRef<{
        lat: number;
        lng: number;
        timestamp: number;
    } | null>(null);

    const isSendingRef = useRef(false);

    const sendLocationUpdate = useCallback(
        async (
            lat: number,
            lng: number,
            heading?: number,
            speedKmh?: number,
            accuracyM?: number,
        ) => {
            try {
                setError(null);
                const input: UpdateDriverLocationInput = {
                    latitude: lat,
                    longitude: lng,
                    heading,
                    speedKmh,
                    accuracyM,
                };
                const updated = await updateDriverLocation(input);
                setLastLocation(updated);
                setLastUpdatedTime(new Date());
                setIsTracking(true);
                return updated;
            } catch (err) {
                const msg =
                    err instanceof Error
                        ? err.message
                        : "Failed to update driver location.";
                setError(msg);
                throw err;
            }
        },
        [],
    );

    useEffect(() => {
        if (typeof window === "undefined" || !("geolocation" in navigator)) {
            setIsSupported(false);
            setError("Geolocation is not supported by this browser.");
            return;
        }

        setIsSupported(true);

        if ("permissions" in navigator && navigator.permissions?.query) {
            navigator.permissions
                .query({ name: "geolocation" as PermissionName })
                .then((status) => {
                    setPermissionState(status.state as "prompt" | "granted" | "denied");
                    status.onchange = () => {
                        setPermissionState(status.state as "prompt" | "granted" | "denied");
                    };
                })
                .catch(() => {
                    // Query not supported in some browsers
                });
        }
    }, []);

    useEffect(() => {
        if (!enabled || !isSupported) {
            setIsTracking(false);
            return;
        }

        let watchId: number | null = null;
        let cancelled = false;

        const sendPosition = async (pos: GeolocationPosition) => {
            if (cancelled) return;

            const { latitude, longitude, heading, speed, accuracy } = pos.coords;
            const now = Date.now();

            setPermissionState("granted");
            setError(null);
            setIsTracking(true);

            // Throttle checks — skip for the very first fix (lastSentRef is null)
            if (lastSentRef.current) {
                const timeDiff = now - lastSentRef.current.timestamp;
                const latDiff = Math.abs(latitude - lastSentRef.current.lat);
                const lngDiff = Math.abs(longitude - lastSentRef.current.lng);

                // If less than interval AND moved less than ~5 meters (~0.00005 deg), skip
                if (timeDiff < updateIntervalMs && latDiff < 0.00005 && lngDiff < 0.00005) {
                    return;
                }
            }

            if (isSendingRef.current) return;

            try {
                isSendingRef.current = true;

                const input: UpdateDriverLocationInput = {
                    latitude,
                    longitude,
                    heading: heading !== null && !isNaN(heading) ? heading : undefined,
                    speedKmh: speed !== null && !isNaN(speed) ? Math.max(0, speed * 3.6) : undefined, // m/s to km/h
                    accuracyM: accuracy !== null && !isNaN(accuracy) ? Math.max(0, accuracy) : undefined,
                };

                const updated = await updateDriverLocation(input);

                lastSentRef.current = {
                    lat: latitude,
                    lng: longitude,
                    timestamp: now,
                };

                setLastLocation(updated);
                setLastUpdatedTime(new Date());
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to update driver location.";
                setError(msg);
            } finally {
                isSendingRef.current = false;
            }
        };

        const handleError = (err: GeolocationPositionError) => {
            if (cancelled) return;
            setIsTracking(false);
            switch (err.code) {
                case err.PERMISSION_DENIED:
                    setPermissionState("denied");
                    setError("Location permission was denied. Please allow access to enable live tracking.");
                    break;
                case err.POSITION_UNAVAILABLE:
                    setError("Location information is currently unavailable.");
                    break;
                case err.TIMEOUT:
                    setError("Location request timed out. Retrying...");
                    break;
                default:
                    setError("An unknown location error occurred.");
            }
        };

        // Immediately get the current position so the very first fix is sent
        // without waiting for watchPosition to fire (which can take several seconds).
        navigator.geolocation.getCurrentPosition(
            (pos) => { void sendPosition(pos); },
            () => { /* Silently ignore — watchPosition will still start */ },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
        );

        // Start continuous watch
        watchId = navigator.geolocation.watchPosition(
            (pos) => { void sendPosition(pos); },
            handleError,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 3000,
            },
        );

        setIsTracking(true);

        return () => {
            cancelled = true;
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
            setIsTracking(false);
        };
    }, [enabled, isSupported, updateIntervalMs]);


    return {
        isSupported,
        isTracking,
        permissionState,
        error,
        lastLocation,
        lastUpdatedTime,
        sendLocationUpdate,
    };
}
