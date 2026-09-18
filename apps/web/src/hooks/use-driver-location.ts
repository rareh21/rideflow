"use client";

import { useEffect, useRef, useState } from "react";
import { updateDriverLocation } from "@/lib/driver-location";

export type LocationPermissionState = "prompt" | "granted" | "denied" | "unsupported";

export type GeolocationErrorCode = "permission_denied" | "unavailable" | "timeout" | "unsupported" | null;

export interface UseDriverLocationOptions {
    enabled: boolean;
    minIntervalMs?: number; // Target 2-5 sec interval, default 3000ms
    minDistanceMeters?: number; // Minimum movement distance to trigger update, default 5m
}

function calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const R = 6371000; // Radius of Earth in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function useDriverLocation({
    enabled,
    minIntervalMs = 3000,
    minDistanceMeters = 3,
}: UseDriverLocationOptions) {
    const isSupported = typeof window !== "undefined" && "geolocation" in navigator;

    const [isTracking, setIsTracking] = useState(false);
    const [permissionState, setPermissionState] = useState<LocationPermissionState>(() =>
        !isSupported ? "unsupported" : "prompt",
    );
    const [errorCode, setErrorCode] = useState<GeolocationErrorCode>(() =>
        !isSupported ? "unsupported" : null,
    );
    const [lastSentTime, setLastSentTime] = useState<number | null>(null);

    const lastCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
    const lastSendTimeRef = useRef<number>(0);
    const watchIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isSupported) return;

        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions
                .query({ name: "geolocation" })
                .then((res) => {
                    setPermissionState(res.state as LocationPermissionState);
                    res.onchange = () => {
                        setPermissionState(res.state as LocationPermissionState);
                    };
                })
                .catch(() => {
                    // Ignore permissions API failures
                });
        }
    }, [isSupported]);

    useEffect(() => {
        if (!enabled || !isSupported) {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            return;
        }

        const handleSuccess = (position: GeolocationPosition) => {
            setIsTracking(true);
            setPermissionState("granted");
            setErrorCode(null);

            const now = Date.now();
            const { latitude, longitude, heading, speed, accuracy } = position.coords;

            // Throttling checks:
            const timeElapsed = now - lastSendTimeRef.current;
            let distanceMoved = 0;

            if (lastCoordsRef.current) {
                distanceMoved = calculateDistanceMeters(
                    lastCoordsRef.current.latitude,
                    lastCoordsRef.current.longitude,
                    latitude,
                    longitude,
                );
            }

            const isFirstUpdate = lastSendTimeRef.current === 0;
            const isTimeElapsed = timeElapsed >= minIntervalMs;
            const isMovedEnough = distanceMoved >= minDistanceMeters;

            if (isFirstUpdate || (isTimeElapsed && isMovedEnough)) {
                lastSendTimeRef.current = now;
                lastCoordsRef.current = { latitude, longitude };
                setLastSentTime(now);

                void updateDriverLocation({
                    latitude,
                    longitude,
                    heading: heading !== null && !isNaN(heading) ? heading : undefined,
                    speedKmh: speed !== null && !isNaN(speed) ? speed * 3.6 : undefined,
                    accuracyM: accuracy !== null && !isNaN(accuracy) ? accuracy : undefined,
                }).catch((err) => {
                    // Fail gracefully on network or validation errors
                    console.warn("[Driver Location] Update failed:", err);
                });
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            setIsTracking(false);
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    setPermissionState("denied");
                    setErrorCode("permission_denied");
                    break;
                case error.POSITION_UNAVAILABLE:
                    setErrorCode("unavailable");
                    break;
                case error.TIMEOUT:
                    setErrorCode("timeout");
                    break;
                default:
                    setErrorCode("unavailable");
                    break;
            }
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 2000,
            },
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [enabled, isSupported, minIntervalMs, minDistanceMeters]);

    return {
        isTracking,
        permissionState,
        errorCode,
        lastSentTime,
    };
}
