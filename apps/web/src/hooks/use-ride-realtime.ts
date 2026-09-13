"use client";

import { useEffect, useRef } from "react";
import {
    subscribeToRideUpdates,
    subscribeToRideRequests,
    type RideUpdatedEvent,
    type RideRequestCreatedEvent,
    type RideRequestRemovedEvent,
} from "@/lib/ride-realtime";

export function useRideRealtime(options: {
    onUpdate?: (event: RideUpdatedEvent) => void;
    onRequestCreated?: (event: RideRequestCreatedEvent) => void;
    onRequestRemoved?: (event: RideRequestRemovedEvent) => void;
    onRequestsChanged?: () => void;
    onConnected?: () => void;
}) {
    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        let cleanupUpdates: (() => void) | undefined;
        let cleanupRequests: (() => void) | undefined;

        if (optionsRef.current.onUpdate) {
            cleanupUpdates = subscribeToRideUpdates(
                (event) => optionsRef.current.onUpdate?.(event),
                () => optionsRef.current.onConnected?.(),
            );
        }

        if (
            optionsRef.current.onRequestCreated ||
            optionsRef.current.onRequestRemoved ||
            optionsRef.current.onRequestsChanged
        ) {
            cleanupRequests = subscribeToRideRequests({
                onRequestCreated: (event) => optionsRef.current.onRequestCreated?.(event),
                onRequestRemoved: (event) => optionsRef.current.onRequestRemoved?.(event),
                onRequestsChanged: () => optionsRef.current.onRequestsChanged?.(),
                onConnected: optionsRef.current.onUpdate ? undefined : () => optionsRef.current.onConnected?.(),
            });
        }

        return () => {
            if (cleanupUpdates) cleanupUpdates();
            if (cleanupRequests) cleanupRequests();
        };
    }, []);
}
