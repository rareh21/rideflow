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
    acceptRide,
    getRideRequests,
    type RideRequest
} from "@/lib/rides";
import { subscribeToRideRequestChanges } from "@/lib/ride-realtime";

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

    const [requests, setRequests] =
        useState<RideRequest[]>([]);

    const [acceptingRideId, setAcceptingRideId] =
        useState<string | null>(null);

    const [requestError, setRequestError] =
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

    async function loadRideRequests() {
        try {
            setRequestError(null);

            const data =
                await getRideRequests();

            setRequests(data);
        } catch (err) {
            setRequestError(
                err instanceof Error
                    ? err.message
                    : "Unable to load ride requests.",
            );
        }
    }

    useEffect(() => {
        void Promise.all([
            loadRides(),
            loadRideRequests(),
        ]);
    }, []);

    useEffect(() => subscribeToRideRequestChanges(
        () => {
            void loadRideRequests();
        },
        () => {
            void loadRideRequests();
        },
    ), []);

    async function handleAcceptRide(
        rideId: string,
    ) {
        try {
            setAcceptingRideId(rideId);
            setRequestError(null);

            await acceptRide(rideId);

            /*
             * Refresh both sections because
             * the accepted ride moves from
             * requests → assigned rides.
             */
            await Promise.all([
                loadRides(),
                loadRideRequests(),
            ]);
        } catch (err) {
            setRequestError(
                err instanceof Error
                    ? err.message
                    : "Unable to accept the ride.",
            );
        } finally {
            setAcceptingRideId(null);
        }
    }

    return (
        <main className="min-h-full bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-4xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                <section className="mt-8">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-green-dark)]">
                                Available now
                            </p>

                            <h2 className="mt-1 text-xl font-bold text-[var(--rf-midnight)]">
                                Ride requests
                            </h2>

                            <p className="mt-1 text-sm text-[var(--rf-muted)]">
                                Accept a nearby ride when
                                you're ready to drive.
                            </p>
                        </div>

                        {requests.length > 0 && (
                            <span className="rounded-full bg-[var(--rf-green)]/10 px-3 py-1 text-xs font-bold text-[var(--rf-green-dark)]">
                                {requests.length}{" "}
                                {requests.length === 1
                                    ? "request"
                                    : "requests"}
                            </span>
                        )}
                    </div>

                    {requestError && (
                        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                            <p className="text-sm text-red-800">
                                {requestError}
                            </p>
                        </div>
                    )}

                    {requests.length === 0 ? (
                        <div className="mt-4 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--rf-surface-muted)]">
                                    <Car
                                        size={19}
                                        className="text-[var(--rf-muted)]"
                                    />
                                </div>

                                <div>
                                    <h3 className="font-semibold text-[var(--rf-midnight)]">
                                        No ride requests
                                    </h3>

                                    <p className="mt-1 text-sm leading-5 text-[var(--rf-muted)]">
                                        New ride requests will
                                        appear here when you're
                                        available.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-4">
                            {requests.map((ride) => (
                                <RideRequestCard
                                    key={ride.id}
                                    ride={ride}
                                    accepting={
                                        acceptingRideId ===
                                        ride.id
                                    }
                                    onAccept={() =>
                                        void handleAcceptRide(
                                            ride.id,
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}
                </section>
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

function RideRequestCard({
    ride,
    accepting,
    onAccept,
}: {
    ride: RideRequest;
    accepting: boolean;
    onAccept: () => void;
}) {
    return (
        <div className="rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-[var(--rf-muted)]">
                        Ride request
                    </p>

                    <h3 className="mt-1 font-bold text-[var(--rf-midnight)]">
                        {ride.rider.name}
                    </h3>
                </div>

                <span className="rounded-full bg-[var(--rf-green)]/10 px-3 py-1.5 text-xs font-bold text-[var(--rf-green-dark)]">
                    {ride.rideType}
                </span>
            </div>

            <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--rf-surface-muted)]">
                        <MapPin
                            size={16}
                            className="text-[var(--rf-green-dark)]"
                        />
                    </div>

                    <p className="truncate text-sm font-medium text-[var(--rf-midnight)]">
                        {
                            ride
                                .pickupLocation
                                .label
                        }
                    </p>
                </div>

                <div className="ml-4 h-3 border-l border-dashed border-[var(--rf-border)]" />

                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--rf-surface-muted)]">
                        <MapPin
                            size={16}
                            className="text-[var(--rf-midnight)]"
                        />
                    </div>

                    <p className="truncate text-sm font-medium text-[var(--rf-midnight)]">
                        {
                            ride
                                .destinationLocation
                                .label
                        }
                    </p>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[var(--rf-surface-muted)] p-3">
                    <p className="text-xs text-[var(--rf-muted)]">
                        Distance
                    </p>

                    <p className="mt-1 text-sm font-bold text-[var(--rf-midnight)]">
                        {
                            ride.estimatedDistanceKm
                        }{" "}
                        km
                    </p>
                </div>

                <div className="rounded-2xl bg-[var(--rf-surface-muted)] p-3">
                    <p className="text-xs text-[var(--rf-muted)]">
                        Estimated fare
                    </p>

                    <p className="mt-1 text-sm font-bold text-[var(--rf-midnight)]">
                        ₹
                        {
                            ride.estimatedFare
                        }
                    </p>
                </div>
            </div>

            <button
                type="button"
                disabled={accepting}
                onClick={onAccept}
                className="
                    mt-5 flex min-h-12 w-full
                    items-center justify-center
                    gap-2 rounded-2xl
                    bg-[var(--rf-green)]
                    px-5
                    text-sm font-bold
                    text-[var(--rf-midnight)]
                    transition
                    hover:bg-[var(--rf-green-dark)]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                "
            >
                {accepting ? (
                    <>
                        <Loader2
                            size={17}
                            className="animate-spin"
                        />
                        Accepting...
                    </>
                ) : (
                    "Accept ride"
                )}
            </button>
        </div>
    );
}
