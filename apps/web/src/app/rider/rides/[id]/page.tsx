"use client";

import {
    AlertCircle,
    ArrowLeft,
    Car,
    CheckCircle2,
    Clock3,
    Loader2,
    MapPin,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
    cancelRide,
    getRide,
    RideStatus,
    type Ride,
} from "@/lib/rides";

import { Button } from "@/components/ui/button";

export default function RideDetailsPage() {
    const params = useParams<{
        id: string;
    }>();

    const rideId = params.id;

    const [ride, setRide] =
        useState<Ride | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [cancelling, setCancelling] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    async function loadRide() {
        try {
            setLoading(true);
            setError(null);

            const data =
                await getRide(rideId);

            setRide(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load this ride.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (rideId) {
            void loadRide();
        }
    }, [rideId]);

    async function handleCancel() {
        if (!ride) {
            return;
        }

        try {
            setCancelling(true);
            setError(null);

            const updatedRide =
                await cancelRide(
                    ride.id,
                );

            setRide(updatedRide);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to cancel the ride.",
            );
        } finally {
            setCancelling(false);
        }
    }

    if (loading) {
        return (
            <main className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                    <div className="space-y-5">
                        <div className="h-5 w-32 animate-pulse rounded bg-[var(--rf-border)]" />
                        <div className="h-10 w-56 animate-pulse rounded bg-[var(--rf-border)]" />
                        <div className="h-80 animate-pulse rounded-3xl bg-[var(--rf-border)]" />
                    </div>
                </div>
            </main>
        );
    }

    if (error && !ride) {
        return (
            <main className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                    <Link
                        href="/rider/rides"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--rf-muted)] hover:text-[var(--rf-green-dark)]"
                    >
                        <ArrowLeft size={16} />
                        My rides
                    </Link>

                    <section className="mt-6 rounded-3xl border border-red-200 bg-[var(--rf-surface)] p-6">
                        <AlertCircle
                            size={22}
                            className="text-[var(--rf-danger)]"
                        />

                        <h1 className="mt-4 font-bold text-[var(--rf-midnight)]">
                            Unable to load ride
                        </h1>

                        <p className="mt-2 text-sm text-[var(--rf-muted)]">
                            {error}
                        </p>

                        <Button
                            className="mt-5"
                            variant="primary"
                            onClick={() =>
                                void loadRide()
                            }
                        >
                            Try again
                        </Button>
                    </section>
                </div>
            </main>
        );
    }

    if (!ride) {
        return null;
    }

    const canCancel =
        ride.status ===
        "SEARCHING_DRIVER" ||
        ride.status ===
        "DRIVER_ASSIGNED" ||
        ride.status ===
        "DRIVER_ARRIVING";

    return (
        <main className="min-h-full bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                <Link
                    href="/rider/rides"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--rf-muted)] hover:text-[var(--rf-green-dark)]"
                >
                    <ArrowLeft size={16} />
                    My rides
                </Link>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-green-dark)]">
                            Ride details
                        </p>

                        <h1 className="mt-2 text-2xl font-bold text-[var(--rf-midnight)]">
                            Your RideFlow trip
                        </h1>
                    </div>

                    <StatusBadge
                        status={ride.status}
                    />
                </div>

                {error && (
                    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <AlertCircle
                            size={18}
                            className="mt-0.5 text-[var(--rf-danger)]"
                        />

                        <p className="text-sm text-red-800">
                            {error}
                        </p>
                    </div>
                )}

                <section className="mt-6 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 shadow-sm sm:p-8">
                    <div className="space-y-4">
                        <Location
                            label="Pickup"
                            value={
                                ride
                                    .pickupLocation
                                    .label
                            }
                            first
                        />

                        <div className="ml-4 h-6 border-l border-dashed border-[var(--rf-border)]" />

                        <Location
                            label="Destination"
                            value={
                                ride
                                    .destinationLocation
                                    .label
                            }
                        />
                    </div>

                    <div className="mt-7 grid gap-4 border-t border-[var(--rf-border)] pt-6 sm:grid-cols-3">
                        <Info
                            label="Ride type"
                            value={
                                ride.rideType
                            }
                        />

                        <Info
                            label="Estimated fare"
                            value={`₹${ride.estimatedFare}`}
                        />

                        <Info
                            label="Distance"
                            value={`${ride.estimatedDistanceKm} km`}
                        />
                    </div>
                </section>

                {ride.driver && (
                    <section className="mt-5 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 shadow-sm sm:p-8">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--rf-green)]/10">
                                <Car
                                    size={22}
                                    className="text-[var(--rf-green-dark)]"
                                />
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-muted)]">
                                    Your driver
                                </p>

                                <h2 className="mt-1 font-bold text-[var(--rf-midnight)]">
                                    {
                                        ride
                                            .driver
                                            .user
                                            .name
                                    }
                                </h2>

                                {ride
                                    .driver
                                    .vehicle && (
                                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                                            {
                                                ride
                                                    .driver
                                                    .vehicle
                                                    .make
                                            }{" "}
                                            {
                                                ride
                                                    .driver
                                                    .vehicle
                                                    .model
                                            }{" "}
                                            ·{" "}
                                            {
                                                ride
                                                    .driver
                                                    .vehicle
                                                    .plateNumber
                                            }
                                        </p>
                                    )}
                            </div>
                        </div>

                        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[var(--rf-surface-muted)] p-4">
                            <ShieldCheck
                                size={18}
                                className="text-[var(--rf-green-dark)]"
                            />

                            <span className="text-sm text-[var(--rf-muted)]">
                                Your driver is
                                assigned to this
                                ride.
                            </span>
                        </div>
                    </section>
                )}

                {canCancel && (
                    <section className="mt-5 rounded-3xl border border-red-100 bg-[var(--rf-surface)] p-6">
                        <h2 className="font-bold text-[var(--rf-midnight)]">
                            Need to cancel?
                        </h2>

                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                            You can cancel this ride
                            while it is still active.
                        </p>

                        <Button
                            variant="danger"
                            className="mt-5"
                            disabled={cancelling}
                            onClick={
                                handleCancel
                            }
                        >
                            {cancelling ? (
                                <>
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                    Cancelling...
                                </>
                            ) : (
                                <>
                                    <XCircle
                                        size={16}
                                    />
                                    Cancel ride
                                </>
                            )}
                        </Button>
                    </section>
                )}
            </div>
        </main>
    );
}

function Location({
    label,
    value,
    first = false,
}: {
    label: string;
    value: string;
    first?: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${first
                        ? "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]"
                        : "bg-[var(--rf-midnight)]/5 text-[var(--rf-midnight)]"
                    }`}
            >
                <MapPin size={16} />
            </div>

            <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--rf-muted)]">
                    {label}
                </p>

                <p className="mt-1 text-sm font-semibold text-[var(--rf-midnight)]">
                    {value}
                </p>
            </div>
        </div>
    );
}

function Info({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl bg-[var(--rf-surface-muted)] p-4">
            <p className="text-xs font-semibold text-[var(--rf-muted)]">
                {label}
            </p>

            <p className="mt-1 text-sm font-bold text-[var(--rf-midnight)]">
                {value}
            </p>
        </div>
    );
}

function StatusBadge({
    status,
}: {
    status: RideStatus;
}) {
    const config =
        STATUS_CONFIG[status];

    const Icon = config.icon;

    return (
        <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${config.className}`}
        >
            <Icon size={14} />
            {config.label}
        </span>
    );
}

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
        className:
            "bg-amber-50 text-amber-700",
    },

    SEARCHING_DRIVER: {
        label: "Finding driver",
        icon: Loader2,
        className:
            "bg-blue-50 text-blue-700",
    },

    DRIVER_ASSIGNED: {
        label: "Driver assigned",
        icon: Car,
        className:
            "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]",
    },

    DRIVER_ARRIVING: {
        label: "Driver arriving",
        icon: Car,
        className:
            "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]",
    },

    IN_PROGRESS: {
        label: "Ride in progress",
        icon: Car,
        className:
            "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]",
    },

    COMPLETED: {
        label: "Completed",
        icon: CheckCircle2,
        className:
            "bg-gray-100 text-gray-700",
    },

    CANCELLED: {
        label: "Cancelled",
        icon: XCircle,
        className:
            "bg-red-50 text-red-700",
    },
};