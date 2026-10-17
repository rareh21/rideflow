"use client";
import { useEffect, useState } from "react";

import { AlertTriangle, Car, Compass, Gauge, MapPin, RefreshCw, WifiOff } from "lucide-react";

import type { DriverLocation } from "@/lib/driver-location";
import { calculateDistanceKm, formatDistance } from "@/lib/driver-location";
import type { TrackingStatus } from "@/hooks/use-driver-tracking";
import { Button } from "@/components/ui/button";

interface LatLng {
    latitude: number | string;
    longitude: number | string;
    label?: string;
}

interface DriverTrackingCardProps {
    driverName?: string;
    location: DriverLocation | null;
    trackingStatus: TrackingStatus;
    rideStatus?: string;
    pickup?: LatLng;
    destination?: LatLng;
    onRefetch?: () => void;
}

export function DriverTrackingCard({
    driverName = "Your driver",
    location,
    trackingStatus,
    rideStatus,
    pickup,
    destination,
    onRefetch,
}: DriverTrackingCardProps) {
    const [currentTime, setCurrentTime] = useState<number | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const updatedAtStr = location?.updatedAt
        ? new Date(location.updatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        })
        : null;

    const secondsAgo = location?.updatedAt && currentTime !== null
        ? Math.max(0, Math.floor((currentTime - new Date(location.updatedAt).getTime()) / 1000))
        : null;

    // Calculate distance to pickup or destination
    const pLat = pickup ? Number(pickup.latitude) : NaN;
    const pLng = pickup ? Number(pickup.longitude) : NaN;
    const dLat = destination ? Number(destination.latitude) : NaN;
    const dLng = destination ? Number(destination.longitude) : NaN;
    const locLat = location ? Number(location.latitude) : NaN;
    const locLng = location ? Number(location.longitude) : NaN;

    const isDriverArriving =
        rideStatus === "DRIVER_ASSIGNED" ||
        rideStatus === "DRIVER_ARRIVING" ||
        rideStatus === "DRIVER_ARRIVED";

    const isInProgress = rideStatus === "IN_PROGRESS";

    // Distance to pickup while arriving, or distance to destination while in progress
    const distanceToTargetKm =
        location && !isNaN(locLat) && !isNaN(locLng)
            ? isDriverArriving && !isNaN(pLat) && !isNaN(pLng)
                ? calculateDistanceKm(locLat, locLng, pLat, pLng)
                : isInProgress && !isNaN(dLat) && !isNaN(dLng)
                    ? calculateDistanceKm(locLat, locLng, dLat, dLng)
                    : null
            : null;

    const distanceAwayFormatted = distanceToTargetKm !== null ? formatDistance(distanceToTargetKm) : null;

    // Subtitle text under driver name
    const subTitle = isDriverArriving
        ? distanceAwayFormatted
            ? `${driverName} is ${distanceAwayFormatted} from pickup`
            : `${driverName} is heading to pickup`
        : isInProgress
            ? distanceAwayFormatted
                ? `${driverName} is ${distanceAwayFormatted} from destination`
                : "Trip in progress"
            : `${driverName} on the way`;

    return (
        <section className="rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                        <Car size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-[var(--rf-midnight)]">
                            Live Driver Tracking
                        </h2>
                        <p className="text-xs text-[var(--rf-muted)]">
                            {subTitle}
                        </p>
                    </div>
                </div>

                <StatusBadge trackingStatus={trackingStatus} />
            </div>

            {/* Proximity / Arriving Highlight Banner */}
            {isDriverArriving && distanceToTargetKm !== null && (
                <div
                    role="status"
                    className={`mt-4 flex items-center justify-between rounded-2xl p-4 border transition-all ${
                        distanceToTargetKm < 0.1
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                            : distanceToTargetKm <= 2
                                ? "bg-blue-50 border-blue-300 text-blue-900 shadow-sm"
                                : "bg-sky-50/70 border-sky-200 text-sky-900"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                distanceToTargetKm < 0.1
                                    ? "bg-emerald-200/60 text-emerald-800"
                                    : "bg-blue-200/60 text-blue-800"
                            }`}
                        >
                            <Car size={20} className={distanceToTargetKm < 0.1 ? "" : "animate-pulse"} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider opacity-75">
                                {distanceToTargetKm < 0.1 ? "Driver Arrived" : "Approaching Pickup"}
                            </p>
                            <p className="text-sm font-bold">
                                {distanceToTargetKm < 0.1 ? (
                                    <span>{driverName} has reached your pickup spot</span>
                                ) : (
                                    <span>
                                        Your driver is <strong>{distanceAwayFormatted}</strong>
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-black shadow-xs">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            {distanceToTargetKm < 0.1 ? "Here" : `${distanceToTargetKm.toFixed(1)} km`}
                        </span>
                    </div>
                </div>
            )}

            {trackingStatus === "stale" && secondsAgo !== null && (
                <div role="alert" className="mt-4 flex items-center gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-800 border border-amber-200">
                    <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                    <span>
                        Location last updated <strong>{secondsAgo} seconds ago</strong>. Showing driver&apos;s last known GPS coordinate.
                    </span>
                </div>
            )}

            {trackingStatus === "disconnected" && (
                <div role="alert" className="mt-4 flex items-center gap-2.5 rounded-2xl bg-red-50 p-3.5 text-xs text-red-800 border border-red-200">
                    <WifiOff size={16} className="shrink-0 text-red-600" />
                    <span>
                        Reconnecting live tracking... Click refresh if updates do not resume.
                    </span>
                    {onRefetch && (
                        <Button
                            variant="secondary"
                            className="ml-auto text-xs px-2.5 py-1 min-h-0"
                            onClick={onRefetch}
                        >
                            <RefreshCw size={12} />
                            Retry
                        </Button>
                    )}
                </div>
            )}

            {location ? (
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--rf-border)] pt-4 text-xs sm:grid-cols-4">
                    <div className="rounded-2xl bg-[var(--rf-surface-muted)] p-3">
                        <span className="flex items-center gap-1 text-[var(--rf-muted)] font-semibold">
                            <MapPin size={12} /> Coordinates
                        </span>
                        <p className="mt-1 font-bold text-[var(--rf-midnight)] truncate">
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-[var(--rf-surface-muted)] p-3">
                        <span className="flex items-center gap-1 text-[var(--rf-muted)] font-semibold">
                            <Gauge size={12} /> Speed
                        </span>
                        <p className="mt-1 font-bold text-[var(--rf-midnight)]">
                            {location.speedKmh !== null && location.speedKmh > 0
                                ? `${Math.round(location.speedKmh)} km/h`
                                : "Stationary"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-[var(--rf-surface-muted)] p-3">
                        <span className="flex items-center gap-1 text-[var(--rf-muted)] font-semibold">
                            <Compass size={12} /> Heading
                        </span>
                        <p className="mt-1 font-bold text-[var(--rf-midnight)]">
                            {location.heading !== null
                                ? `${Math.round(location.heading)}° ${getCardinalDirection(location.heading)}`
                                : "N/A"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-[var(--rf-surface-muted)] p-3">
                        <span className="flex items-center gap-1 text-[var(--rf-muted)] font-semibold">
                            Updated
                        </span>
                        <p className="mt-1 font-bold text-[var(--rf-midnight)]">
                            {updatedAtStr ?? "Just now"}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="mt-4 rounded-2xl bg-[var(--rf-surface-muted)] p-4 text-center text-xs text-[var(--rf-muted)]">
                    Driver location is currently unavailable. Waiting for GPS signal from driver...
                </div>
            )}
        </section>
    );
}

function StatusBadge({ trackingStatus }: { trackingStatus: TrackingStatus }) {
    switch (trackingStatus) {
        case "live":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live
                </span>
            );
        case "recent":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                    Recently updated
                </span>
            );
        case "stale":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                    Stale
                </span>
            );
        case "disconnected":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">
                    Reconnecting
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 border border-gray-200">
                    Unavailable
                </span>
            );
    }
}

function getCardinalDirection(angle: number): string {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(angle / 45) % 8;
    return directions[index];
}
