"use client";

import {
    AlertCircle,
    ArrowRight,
    Car,
    CheckCircle2,
    Clock3,
    Compass,
    Loader2,
    MapPin,
    PlayCircle,
    XCircle,
} from "lucide-react";
import { useState } from "react";

import { updateRideStatus, type Ride, type RideStatus } from "@/lib/rides";
import { determineVehicleType } from "@/lib/vehicles";
import { RouteMap } from "@/components/route-map";

const STATUS_CONFIG: Record<
    RideStatus,
    {
        label: string;
        icon: typeof Clock3;
        className: string;
    }
> = {
    REQUESTED: {
        label: "Requested",
        icon: Clock3,
        className: "bg-amber-50 text-amber-700",
    },
    SEARCHING_DRIVER: {
        label: "Finding driver",
        icon: Loader2,
        className: "bg-blue-50 text-blue-700",
    },
    DRIVER_ASSIGNED: {
        label: "Driver Assigned",
        icon: Car,
        className: "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]",
    },
    DRIVER_ARRIVING: {
        label: "Arriving at Pickup",
        icon: Car,
        className: "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]",
    },
    DRIVER_ARRIVED: {
        label: "Arrived at Pickup",
        icon: MapPin,
        className: "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]",
    },
    IN_PROGRESS: {
        label: "Trip in Progress",
        icon: PlayCircle,
        className: "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]",
    },
    COMPLETED: {
        label: "Completed",
        icon: CheckCircle2,
        className: "bg-gray-100 text-gray-700",
    },
    CANCELLED: {
        label: "Cancelled",
        icon: XCircle,
        className: "bg-red-50 text-red-700",
    },
};

type DriverCurrentRideCardProps = {
    ride: Ride;
    onUpdate?: (updatedRide: Ride) => void;
    onCompleted?: () => void;
};

export function DriverCurrentRideCard({
    ride,
    onUpdate,
    onCompleted,
}: DriverCurrentRideCardProps) {
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [showCompletionModal, setShowCompletionModal] = useState(false);

    const vehicleTier = ride.driver?.vehicle
        ? determineVehicleType(ride.driver.vehicle.make, ride.driver.vehicle.model)
        : ride.rideType;

    const navigateTarget =
        ride.status === "IN_PROGRESS"
            ? ride.destinationLocation.label
            : ride.pickupLocation.label;

    const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        navigateTarget,
    )}`;

    async function handleStatusTransition(nextStatus: RideStatus) {
        if (updating) return;

        try {
            setUpdating(true);
            setError(null);

            const updated = await updateRideStatus(ride.id, nextStatus);

            if (nextStatus === "DRIVER_ARRIVING") {
                setFeedback("Rider has been notified that you are on the way.");
            } else if (nextStatus === "DRIVER_ARRIVED") {
                setFeedback("Rider has been notified of your arrival!");
            } else if (nextStatus === "IN_PROGRESS") {
                setFeedback("Ride started. Have a safe trip!");
            } else if (nextStatus === "COMPLETED") {
                setFeedback("Ride completed. Your availability has been restored.");
                onCompleted?.();
            } else if (nextStatus === "CANCELLED") {
                setFeedback("Ride cancelled.");
                onCompleted?.();
            }

            onUpdate?.(updated);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to update ride status.",
            );
        } finally {
            setUpdating(false);
            setShowCompletionModal(false);
        }
    }

    return (
        <div className="rounded-3xl border-2 border-[var(--rf-green)] bg-[var(--rf-surface)] p-6 shadow-md sm:p-8">

            {/* Header: Rider Name & Status Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="rounded-md bg-[var(--rf-green)]/10 px-2 py-0.5 text-xs font-bold text-[var(--rf-green-dark)]">
                            {vehicleTier} Tier
                        </span>
                        <span className="text-xs text-[var(--rf-muted)]">Active Ride</span>
                    </div>

                    <h2 className="mt-1 text-xl font-bold text-[var(--rf-midnight)]">
                        {ride.rider?.name ?? "Rider"}
                    </h2>
                </div>

                <StatusBadge status={ride.status} />
            </div>

            {/* Feedback & Error banners */}
            {feedback && (
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-[var(--rf-green)]/10 p-3.5 text-xs font-bold text-[var(--rf-green-dark)]">
                    <span>{feedback}</span>
                    <button
                        type="button"
                        onClick={() => setFeedback(null)}
                        className="underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {error && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 p-3.5 text-xs font-bold text-red-700">
                    <AlertCircle size={15} className="shrink-0 text-red-600" />
                    <span>{error}</span>
                </div>
            )}

            {/* Interactive Route Map */}
            <div className="mt-5 h-48 w-full overflow-hidden rounded-2xl border border-[var(--rf-border)] shadow-inner">
                <RouteMap
                    pickup={ride.pickupLocation}
                    destination={ride.destinationLocation}
                />
            </div>

            {/* Route Summary */}
            <div className="mt-5 space-y-3 rounded-2xl bg-[var(--rf-surface-muted)] p-4">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                        <MapPin size={14} />
                    </div>
                    <div>
                        <p className="text-xs text-[var(--rf-muted)]">Pickup</p>
                        <p className="text-sm font-semibold text-[var(--rf-midnight)]">
                            {ride.pickupLocation.label}
                        </p>
                    </div>
                </div>

                <div className="ml-3.5 h-3 border-l border-dashed border-[var(--rf-border)]" />

                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--rf-midnight)] text-white">
                        <MapPin size={14} />
                    </div>
                    <div>
                        <p className="text-xs text-[var(--rf-muted)]">Destination</p>
                        <p className="text-sm font-semibold text-[var(--rf-midnight)]">
                            {ride.destinationLocation.label}
                        </p>
                    </div>
                </div>
            </div>

            {/* Trip Specs Metrics */}
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-[var(--rf-surface-muted)] p-3">
                    <p className="text-xs text-[var(--rf-muted)]">Distance</p>
                    <p className="mt-1 text-sm font-bold text-[var(--rf-midnight)]">
                        {ride.estimatedDistanceKm} km
                    </p>
                </div>

                <div className="rounded-2xl bg-[var(--rf-surface-muted)] p-3">
                    <p className="text-xs text-[var(--rf-muted)]">ETA</p>
                    <p className="mt-1 text-sm font-bold text-[var(--rf-midnight)]">
                        ~{ride.estimatedDurationMinutes} min
                    </p>
                </div>

                <div className="rounded-2xl bg-[var(--rf-surface-muted)] p-3">
                    <p className="text-xs text-[var(--rf-muted)]">Fare</p>
                    <p className="mt-1 text-sm font-bold text-[var(--rf-midnight)]">
                        ₹{ride.estimatedFare}
                    </p>
                </div>
            </div>

            {/* Payment Method */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--rf-border)] px-4 py-3 text-xs">
                <span className="text-[var(--rf-muted)]">Payment Method:</span>
                <span className="font-bold text-[var(--rf-midnight)]">
                    {ride.paymentMethod ?? "UPI"}
                </span>
            </div>

            {/* Operational Action Controls */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[var(--rf-border)] pt-5">

                {/* Primary State Action */}
                {ride.status === "DRIVER_ASSIGNED" && (
                    <button
                        type="button"
                        disabled={updating}
                        onClick={() => void handleStatusTransition("DRIVER_ARRIVING")}
                        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--rf-green)] px-5 text-sm font-bold text-[var(--rf-midnight)] transition hover:bg-[var(--rf-green-dark)] disabled:opacity-60"
                    >
                        {updating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Notifying rider…
                            </>
                        ) : (
                            <>
                                I&apos;m Arriving
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                )}

                {ride.status === "DRIVER_ARRIVING" && (
                    <button
                        type="button"
                        disabled={updating}
                        onClick={() => void handleStatusTransition("DRIVER_ARRIVED")}
                        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--rf-green)] px-5 text-sm font-bold text-[var(--rf-midnight)] transition hover:bg-[var(--rf-green-dark)] disabled:opacity-60"
                    >
                        {updating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Notifying rider…
                            </>
                        ) : (
                            <>
                                <MapPin size={17} />
                                I&apos;ve Arrived
                            </>
                        )}
                    </button>
                )}

                {ride.status === "DRIVER_ARRIVED" && (
                    <button
                        type="button"
                        disabled={updating}
                        onClick={() => void handleStatusTransition("IN_PROGRESS")}
                        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--rf-green)] px-5 text-sm font-bold text-[var(--rf-midnight)] transition hover:bg-[var(--rf-green-dark)] disabled:opacity-60"
                    >
                        {updating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Starting ride…
                            </>
                        ) : (
                            <>
                                <PlayCircle size={17} />
                                Start Ride
                            </>
                        )}
                    </button>
                )}

                {ride.status === "IN_PROGRESS" && (
                    <button
                        type="button"
                        disabled={updating}
                        onClick={() => setShowCompletionModal(true)}
                        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--rf-green)] px-5 text-sm font-bold text-[var(--rf-midnight)] transition hover:bg-[var(--rf-green-dark)] disabled:opacity-60"
                    >
                        <CheckCircle2 size={17} />
                        Complete Ride
                    </button>
                )}

                {/* External Navigation CTA */}
                <a
                    href={navigateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface-muted)] px-5 text-sm font-semibold text-[var(--rf-midnight)] transition hover:bg-gray-100"
                >
                    <Compass size={16} />
                    Navigate
                </a>

                {/* Cancel Ride Action */}
                {(ride.status === "DRIVER_ASSIGNED" || ride.status === "DRIVER_ARRIVING" || ride.status === "DRIVER_ARRIVED") && (
                    <button
                        type="button"
                        disabled={updating}
                        onClick={() => void handleStatusTransition("CANCELLED")}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                    >
                        {updating ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <XCircle size={16} />
                        )}
                        Cancel Ride
                    </button>
                )}
            </div>

            {/* Confirmation Modal for Ride Completion */}
            {showCompletionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl sm:p-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                            <CheckCircle2 size={24} />
                        </div>

                        <h3 className="mt-4 text-xl font-bold text-[var(--rf-midnight)]">
                            Complete this ride?
                        </h3>

                        <p className="mt-2 text-sm text-[var(--rf-muted)]">
                            This will mark the trip as completed and make you available for another ride.
                        </p>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                disabled={updating}
                                onClick={() => setShowCompletionModal(false)}
                                className="rounded-2xl border border-[var(--rf-border)] px-5 py-3 text-sm font-semibold text-[var(--rf-midnight)] transition hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={updating}
                                onClick={() => void handleStatusTransition("COMPLETED")}
                                className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--rf-green)] px-5 py-3 text-sm font-bold text-[var(--rf-midnight)] transition hover:bg-[var(--rf-green-dark)] disabled:opacity-60"
                            >
                                {updating ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Completing…
                                    </>
                                ) : (
                                    "Complete Ride"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: RideStatus }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.REQUESTED;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${config.className}`}>
            <Icon size={14} />
            {config.label}
        </span>
    );
}
