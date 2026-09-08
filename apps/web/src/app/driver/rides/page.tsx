"use client";

import {
    AlertCircle,
    ArrowRight,
    Car,
    CheckCircle2,
    Clock3,
    Loader2,
    MapPin,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
    getDriverRides,
    type Ride,
    type RideStatus,
} from "@/lib/rides";

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
        label: "Assigned",
        icon: Car,
        className:
            "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]",
    },

    DRIVER_ARRIVING: {
        label: "Arriving",
        icon: Car,
        className:
            "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]",
    },

    IN_PROGRESS: {
        label: "In progress",
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

export default function DriverRidesPage() {
    const [rides, setRides] =
        useState<Ride[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    async function loadRides() {
        try {
            setLoading(true);
            setError(null);

            const data =
                await getDriverRides();

            setRides(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load your rides.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadRides();
    }, []);

    return (
        <main className="min-h-full bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-4xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                <header>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-green-dark)]">
                        Driver
                    </p>

                    <h1 className="mt-2 text-2xl font-bold text-[var(--rf-midnight)] sm:text-3xl">
                        My rides
                    </h1>

                    <p className="mt-2 text-sm text-[var(--rf-muted)]">
                        View your assigned RideFlow
                        trips.
                    </p>
                </header>

                {loading && (
                    <div className="mt-6 space-y-4">
                        {[1, 2, 3].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="h-40 animate-pulse rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)]"
                                />
                            ),
                        )}
                    </div>
                )}

                {!loading && error && (
                    <section className="mt-6 rounded-3xl border border-red-200 bg-[var(--rf-surface)] p-6">
                        <div className="flex gap-3">
                            <AlertCircle
                                size={20}
                                className="text-[var(--rf-danger)]"
                            />

                            <p className="text-sm text-[var(--rf-muted)]">
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                void loadRides()
                            }
                            className="mt-5 text-sm font-semibold text-[var(--rf-green-dark)]"
                        >
                            Try again
                        </button>
                    </section>
                )}

                {!loading &&
                    !error &&
                    rides.length === 0 && (
                        <section className="mt-6 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-8 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--rf-green)]/10">
                                <Car
                                    size={26}
                                    className="text-[var(--rf-green-dark)]"
                                />
                            </div>

                            <h2 className="mt-5 text-lg font-bold text-[var(--rf-midnight)]">
                                No assigned rides
                            </h2>

                            <p className="mt-2 text-sm text-[var(--rf-muted)]">
                                Assigned rides will
                                appear here.
                            </p>
                        </section>
                    )}

                {!loading &&
                    !error &&
                    rides.length > 0 && (
                        <div className="mt-6 space-y-4">
                            {rides.map(
                                (ride) => (
                                    <Link
                                        key={
                                            ride.id
                                        }
                                        href={`/driver/rides/${ride.id}`}
                                        className="block rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-xs text-[var(--rf-muted)]">
                                                    {formatDate(
                                                        ride.createdAt,
                                                    )}
                                                </p>

                                                <p className="mt-1 font-bold text-[var(--rf-midnight)]">
                                                    {ride
                                                        .rider
                                                        ?.name ??
                                                        "Rider"}
                                                </p>
                                            </div>

                                            <StatusBadge
                                                status={
                                                    ride.status
                                                }
                                            />
                                        </div>

                                        <div className="mt-5 space-y-3">
                                            <LocationRow
                                                label={
                                                    ride
                                                        .pickupLocation
                                                        .label
                                                }
                                            />

                                            <LocationRow
                                                label={
                                                    ride
                                                        .destinationLocation
                                                        .label
                                                }
                                            />
                                        </div>

                                        <div className="mt-5 flex justify-end border-t border-[var(--rf-border)] pt-4">
                                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--rf-green-dark)]">
                                                View ride
                                                <ArrowRight
                                                    size={
                                                        16
                                                    }
                                                />
                                            </span>
                                        </div>
                                    </Link>
                                ),
                            )}
                        </div>
                    )}
            </div>
        </main>
    );
}

function LocationRow({
    label,
}: {
    label: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--rf-surface-muted)] text-[var(--rf-green-dark)]">
                <MapPin size={16} />
            </div>

            <p className="truncate text-sm font-medium text-[var(--rf-midnight)]">
                {label}
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
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${config.className}`}
        >
            <Icon size={14} />
            {config.label}
        </span>
    );
}

function formatDate(
    value: string,
) {
    return new Intl.DateTimeFormat(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short",
        },
    ).format(new Date(value));
}