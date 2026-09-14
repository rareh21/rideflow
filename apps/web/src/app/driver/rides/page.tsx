"use client";

import {
    ArrowRight,
    Car,
    Clock3,
    Loader2,
    MapPin,
    Radio,
    ShieldCheck,
    XCircle,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Can } from "@/authorization/Can";
import { Permissions } from "@/authorization/permissions";
import {
    getMyDriver,
    updateDriverStatus,
    type DriverProfile,
} from "@/lib/drivers";
import {
    acceptRide,
    getDriverRideRequests,
    getDriverRides,
    getDriverCurrentRide,
    type DriverRideRequest,
    type Ride,
    type RideStatus,
} from "@/lib/rides";
import { determineVehicleType } from "@/lib/vehicles";
import { useRideRealtime } from "@/hooks/use-ride-realtime";
import { useAuthorization } from "@/components/auth/authorization-context";
import { DriverCurrentRideCard } from "@/components/driver-current-ride-card";

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
        label: "Assigned",
        icon: Car,
        className: "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]",
    },
    DRIVER_ARRIVING: {
        label: "Arriving",
        icon: Car,
        className: "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]",
    },
    DRIVER_ARRIVED: {
        label: "Arrived",
        icon: MapPin,
        className: "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]",
    },
    IN_PROGRESS: {
        label: "In progress",
        icon: Car,
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

export default function DriverRidesPage() {
    return (
        <Can permission={Permissions.DRIVER_RIDE_VIEW}>
            <DriverRidesContent />
        </Can>
    );
}

function DriverRidesContent() {
    const { hasPermission } = useAuthorization();
    const canAccept = hasPermission(Permissions.DRIVER_RIDE_ACCEPT);

    const [driver, setDriver] = useState<DriverProfile | null>(null);
    const [currentRide, setCurrentRide] = useState<Ride | null>(null);
    const [assignedRides, setAssignedRides] = useState<Ride[]>([]);
    const [requests, setRequests] = useState<DriverRideRequest[]>([]);
    const [loadingDriver, setLoadingDriver] = useState(true);
    const [loadingCurrentRide, setLoadingCurrentRide] = useState(true);
    const [loadingRides, setLoadingRides] = useState(true);

    const [acceptingRideId, setAcceptingRideId] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const [pageError, setPageError] = useState<string | null>(null);
    const [requestFeedback, setRequestFeedback] = useState<string | null>(null);

    const driverVehicleType = driver?.vehicle
        ? determineVehicleType(driver.vehicle.make, driver.vehicle.model)
        : null;

    const loadDriver = useCallback(async () => {
        try {
            setLoadingDriver(true);
            setPageError(null);
            const data = await getMyDriver();
            setDriver(data);
        } catch (err) {
            setPageError(
                err instanceof Error
                    ? err.message
                    : "Unable to load driver profile.",
            );
        } finally {
            setLoadingDriver(false);
        }
    }, []);

    const loadCurrentRide = useCallback(async () => {
        try {
            setLoadingCurrentRide(true);
            const active = await getDriverCurrentRide();
            setCurrentRide(active);
        } catch {
            setCurrentRide(null);
        } finally {
            setLoadingCurrentRide(false);
        }
    }, []);

    const loadRequests = useCallback(async () => {
        try {
            const data = await getDriverRideRequests();
            if (driverVehicleType) {
                setRequests(data.filter((r) => r.rideType === driverVehicleType));
            } else {
                setRequests(data);
            }
        } catch (err) {
            console.error("Failed to load requests", err);
        }
    }, [driverVehicleType]);

    const loadAssignedRides = useCallback(async () => {
        try {
            setLoadingRides(true);
            const data = await getDriverRides();
            setAssignedRides(data);
        } catch (err) {
            setPageError(
                err instanceof Error ? err.message : "Unable to load assigned rides.",
            );
        } finally {
            setLoadingRides(false);
        }
    }, []);

    useEffect(() => {
        void loadDriver();
        void loadCurrentRide();
        void loadAssignedRides();
    }, [loadDriver, loadCurrentRide, loadAssignedRides]);

    useEffect(() => {
        if (driver?.status === "AVAILABLE" && driver?.vehicle) {
            void loadRequests();
        } else {
            setRequests([]);
        }
    }, [driver?.status, driver?.vehicle, loadRequests]);

    // Realtime subscriptions & Reconnect reconciliation
    useRideRealtime({
        onRequestCreated: (event) => {
            if (driver?.status === "AVAILABLE" && driverVehicleType) {
                if (event.ride.rideType === driverVehicleType) {
                    setRequests((prev) => {
                        if (prev.some((r) => r.id === event.ride.id)) return prev;
                        return [event.ride, ...prev];
                    });
                }
            }
        },
        onRequestRemoved: (event) => {
            setRequests((prev) => prev.filter((r) => r.id !== event.rideId));
        },
        onRequestsChanged: () => {
            if (driver?.status === "AVAILABLE" && driver?.vehicle) {
                void loadRequests();
            }
        },
        onUpdate: () => {
            void loadCurrentRide();
            void loadAssignedRides();
            void loadDriver();
        },
        onConnected: () => {
            // Reconnect reconciliation (HTTP source of truth)
            void loadDriver();
            void loadCurrentRide();
            void loadAssignedRides();
            if (driver?.status === "AVAILABLE" && driver?.vehicle) {
                void loadRequests();
            }
        },
    });

    async function handleStatusChange(status: "AVAILABLE" | "OFFLINE") {
        if (!driver || updatingStatus) return;

        try {
            setUpdatingStatus(true);
            setPageError(null);
            const updated = await updateDriverStatus(status);
            setDriver(updated);
            if (updated.status === "AVAILABLE" && updated.vehicle) {
                void loadRequests();
            } else {
                setRequests([]);
            }
        } catch (err) {
            setPageError(
                err instanceof Error ? err.message : "Unable to update availability status.",
            );
        } finally {
            setUpdatingStatus(false);
        }
    }

    async function handleAcceptRide(rideId: string) {
        if (!canAccept || acceptingRideId) return;

        try {
            setAcceptingRideId(rideId);
            setRequestFeedback(null);

            const response = await acceptRide(rideId);

            if (response.accepted && response.ride) {
                setRequests((prev) => prev.filter((r) => r.id !== rideId));
                if (driver) {
                    setDriver({ ...driver, status: "BUSY" });
                }
                setCurrentRide(response.ride);
                setAssignedRides((prev) => [response.ride, ...prev.filter((r) => r.id !== rideId)]);
                setRequestFeedback("Ride accepted! You are now assigned to this trip.");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to accept ride.";

            if (
                message.includes("no longer available") ||
                message.includes("handling another ride") ||
                message.includes("already assigned")
            ) {
                setRequests((prev) => prev.filter((r) => r.id !== rideId));
                setRequestFeedback("This ride was accepted by another driver.");
            } else {
                setRequestFeedback(message);
            }
        } finally {
            setAcceptingRideId(null);
        }
    }

    function handleRideCompletedOrCancelled() {
        setCurrentRide(null);
        void loadDriver();
        void loadAssignedRides();
    }

    if (loadingDriver || loadingCurrentRide) {
        return (
            <main className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-4xl px-4 py-8 pb-28 sm:px-6 lg:py-10">
                    <div className="flex items-center gap-3">
                        <Loader2 className="animate-spin text-[var(--rf-green-dark)]" size={24} />
                        <p className="text-sm font-semibold text-[var(--rf-midnight)]">
                            Loading current ride…
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-full bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-4xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                <header>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-green-dark)]">
                                Driver Console
                            </p>

                            <h1 className="mt-2 text-2xl font-bold text-[var(--rf-midnight)] sm:text-3xl">
                                Ride Requests & Trips
                            </h1>
                        </div>

                        {driverVehicleType && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--rf-green)]/10 px-3.5 py-1.5 text-xs font-bold text-[var(--rf-green-dark)]">
                                Vehicle Tier: {driverVehicleType}
                            </span>
                        )}
                    </div>
                </header>

                {pageError && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-[var(--rf-danger)]">
                        {pageError}
                    </div>
                )}

                {requestFeedback && (
                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        <span>{requestFeedback}</span>
                        <button
                            type="button"
                            onClick={() => setRequestFeedback(null)}
                            className="text-xs font-bold text-amber-900 underline"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* ── MISSING VEHICLE PROMPT ───────────────────────────── */}
                {!driver?.vehicle && (
                    <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm sm:p-8">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                                <Car size={24} />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold">Vehicle registration required</h2>
                                <p className="mt-1 text-sm text-amber-800">
                                    You need to add your vehicle details to start seeing ride requests that match your vehicle type (GO, PLUS, XL).
                                </p>
                                <Link
                                    href="/driver/vehicle"
                                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-800 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-amber-900"
                                >
                                    Add Vehicle Details
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── DRIVER STATUS-BASED VIEWS ───────────────────────── */}

                {/* STATE 1: OFFLINE */}
                {driver?.status === "OFFLINE" && (
                    <section className="mt-6 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 text-center sm:p-8">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
                            <ShieldCheck size={28} />
                        </div>

                        <h2 className="mt-4 text-xl font-bold text-[var(--rf-midnight)]">
                            You&apos;re offline
                        </h2>

                        <p className="mt-2 text-sm text-[var(--rf-muted)]">
                            Go online to receive ride requests matching your vehicle tier ({driverVehicleType ?? "Standard"}).
                        </p>

                        <div className="mt-6 flex justify-center">
                            <button
                                type="button"
                                disabled={updatingStatus || !driver?.vehicle}
                                onClick={() => void handleStatusChange("AVAILABLE")}
                                className="flex min-h-12 items-center gap-2 rounded-2xl bg-[var(--rf-green)] px-6 text-sm font-bold text-[var(--rf-midnight)] transition hover:bg-[var(--rf-green-dark)] disabled:opacity-60"
                            >
                                {updatingStatus ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Going online...
                                    </>
                                ) : (
                                    "Go Online"
                                )}
                            </button>
                        </div>
                    </section>
                )}

                {/* STATE 2: BUSY (DriverCurrentRideCard) */}
                {driver?.status === "BUSY" && currentRide && (
                    <section className="mt-6">
                        <DriverCurrentRideCard
                            ride={currentRide}
                            onUpdate={(updated) => {
                                setCurrentRide(updated);
                                if (updated.status === "COMPLETED" || updated.status === "CANCELLED") {
                                    handleRideCompletedOrCancelled();
                                }
                            }}
                            onCompleted={handleRideCompletedOrCancelled}
                        />
                    </section>
                )}

                {/* STATE 3: AVAILABLE (Requests Feed) */}
                {driver?.status === "AVAILABLE" && driver?.vehicle && !currentRide && (
                    <section className="mt-6 space-y-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Radio size={18} className="text-[var(--rf-green-dark)]" />
                                    <h2 className="text-xl font-bold text-[var(--rf-midnight)]">
                                        Available Ride Requests
                                    </h2>
                                </div>
                                <p className="mt-1 text-sm text-[var(--rf-muted)]">
                                    Showing requests for <span className="font-semibold text-[var(--rf-midnight)]">{driverVehicleType}</span> vehicle tier.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => void loadRequests()}
                                className="text-xs font-semibold text-[var(--rf-green-dark)] transition hover:underline"
                            >
                                Refresh feed
                            </button>
                        </div>

                        {requests.length === 0 ? (
                            <div className="rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-8 text-center sm:p-10">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--rf-surface-muted)]">
                                    <Car size={26} className="text-[var(--rf-muted)]" />
                                </div>

                                <h3 className="mt-4 text-lg font-bold text-[var(--rf-midnight)]">
                                    No {driverVehicleType} ride requests right now
                                </h3>

                                <p className="mt-2 text-sm text-[var(--rf-muted)]">
                                    New ride requests for {driverVehicleType} vehicles will appear here in real-time.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => void loadRequests()}
                                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--rf-green-dark)]"
                                >
                                    Refresh feed
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {requests.map((ride) => (
                                    <DriverRideRequestCard
                                        key={ride.id}
                                        ride={ride}
                                        accepting={acceptingRideId === ride.id}
                                        canAccept={canAccept}
                                        onAccept={() => void handleAcceptRide(ride.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* ── ASSIGNED & PAST RIDES HISTORY ─────────────────── */}
                <section className="mt-10 pt-8 border-t border-[var(--rf-border)]">
                    <h2 className="text-lg font-bold text-[var(--rf-midnight)]">
                        Ride History
                    </h2>

                    {loadingRides && (
                        <div className="mt-4 space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-32 animate-pulse rounded-3xl bg-[var(--rf-surface)] border border-[var(--rf-border)]" />
                            ))}
                        </div>
                    )}

                    {!loadingRides && assignedRides.length === 0 && (
                        <div className="mt-4 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 text-center text-sm text-[var(--rf-muted)]">
                            No assigned or completed rides yet.
                        </div>
                    )}

                    {!loadingRides && assignedRides.length > 0 && (
                        <div className="mt-4 space-y-4">
                            {assignedRides.map((ride) => (
                                <Link
                                    key={ride.id}
                                    href={`/driver/rides/${ride.id}`}
                                    className="block rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs text-[var(--rf-muted)]">
                                                {formatDate(ride.createdAt)}
                                            </p>
                                            <p className="mt-1 font-bold text-[var(--rf-midnight)]">
                                                {ride.rider?.name ?? "Rider"}
                                            </p>
                                        </div>
                                        <StatusBadge status={ride.status} />
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        <LocationRow label={ride.pickupLocation.label} />
                                        <LocationRow label={ride.destinationLocation.label} />
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-[var(--rf-border)] pt-3 text-xs text-[var(--rf-muted)]">
                                        <span>₹{ride.estimatedFare} · {ride.paymentMethod ?? "UPI"}</span>
                                        <span className="inline-flex items-center gap-1 font-semibold text-[var(--rf-green-dark)]">
                                            View details
                                            <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

function DriverRideRequestCard({
    ride,
    accepting,
    canAccept,
    onAccept,
}: {
    ride: DriverRideRequest;
    accepting: boolean;
    canAccept: boolean;
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
                        {ride.rider?.name ?? "Rider"}
                    </h3>
                </div>

                <span className="rounded-full bg-[var(--rf-green)]/10 px-3 py-1.5 text-xs font-bold text-[var(--rf-green-dark)]">
                    {ride.rideType}
                </span>
            </div>

            <div className="mt-5 space-y-3">
                <LocationRow label={ride.pickupLocation.label} />
                <div className="ml-4 h-3 border-l border-dashed border-[var(--rf-border)]" />
                <LocationRow label={ride.destinationLocation.label} />
            </div>

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

            {ride.paymentMethod && (
                <p className="mt-3 text-xs text-[var(--rf-muted)]">
                    Payment method: <span className="font-semibold text-[var(--rf-midnight)]">{ride.paymentMethod}</span>
                </p>
            )}

            <button
                type="button"
                disabled={accepting || !canAccept}
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
                        <Loader2 size={17} className="animate-spin" />
                        Accepting...
                    </>
                ) : (
                    "Accept ride"
                )}
            </button>
        </div>
    );
}

function LocationRow({ label }: { label: string }) {
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

function StatusBadge({ status }: { status: RideStatus }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.REQUESTED;
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

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}
