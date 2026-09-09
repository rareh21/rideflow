"use client";

import {
    AlertCircle,
    ArrowLeft,
    Car,
    CheckCircle2,
    Clock3,
    Loader2,
    MapPin,
    PlayCircle,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
    getRide,
    type Ride,
    type RideStatus,
    updateRideStatus,
} from "@/lib/rides";
import { subscribeToRideUpdates } from "@/lib/ride-realtime";
import { Button } from "@/components/ui/button";

const ACTIONS: Partial<Record<RideStatus, {
    next: RideStatus;
    label: string;
    loadingLabel: string;
    icon: typeof Car;
}>> = {
    DRIVER_ASSIGNED: {
        next: "DRIVER_ARRIVING",
        label: "I've arrived",
        loadingLabel: "Updating arrival...",
        icon: Car,
    },
    DRIVER_ARRIVING: {
        next: "IN_PROGRESS",
        label: "Start ride",
        loadingLabel: "Starting ride...",
        icon: PlayCircle,
    },
    IN_PROGRESS: {
        next: "COMPLETED",
        label: "Complete ride",
        loadingLabel: "Completing ride...",
        icon: CheckCircle2,
    },
};

export default function DriverRideDetailsPage() {
    const params = useParams<{ id: string }>();
    const rideId = params.id;

    const [ride, setRide] = useState<Ride | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function loadRide(showLoading = true) {
        try {
            if (showLoading) {
                setLoading(true);
            }
            setError(null);
            setRide(await getRide(rideId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load this ride.");
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }

    useEffect(() => {
        if (rideId) {
            void loadRide();
        }
    }, [rideId]);

    useEffect(() => subscribeToRideUpdates((event) => {
        if (event.rideId === rideId) {
            setRide(event.ride);
            setError(null);
        }
    }), [rideId]);

    async function advanceRide() {
        const action = ride ? ACTIONS[ride.status] : undefined;
        if (!ride || !action || updating) {
            return;
        }

        try {
            setUpdating(true);
            setError(null);
            setRide(await updateRideStatus(ride.id, action.next));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update this ride.");
        } finally {
            setUpdating(false);
        }
    }

    async function cancelRide() {
        if (!ride || !canDriverCancel(ride.status) || updating) {
            return;
        }

        try {
            setUpdating(true);
            setError(null);
            setRide(await updateRideStatus(ride.id, "CANCELLED"));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to cancel this ride.");
        } finally {
            setUpdating(false);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error && !ride) {
        return (
            <main className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                    <BackLink />
                    <section className="mt-6 rounded-3xl border border-red-200 bg-[var(--rf-surface)] p-6 shadow-sm">
                        <AlertCircle size={22} className="text-[var(--rf-danger)]" />
                        <h1 className="mt-4 font-bold text-[var(--rf-midnight)]">Unable to load ride</h1>
                        <p className="mt-2 text-sm text-[var(--rf-muted)]">{error}</p>
                        <Button className="mt-5" variant="primary" onClick={() => void loadRide()}>Try again</Button>
                    </section>
                </div>
            </main>
        );
    }

    if (!ride) {
        return null;
    }

    const action = ACTIONS[ride.status];
    const ActionIcon = action?.icon;

    return (
        <main className="min-h-full bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                <BackLink />
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-green-dark)]">Driver ride</p>
                        <h1 className="mt-2 text-2xl font-bold text-[var(--rf-midnight)]">Manage your trip</h1>
                    </div>
                    <StatusBadge status={ride.status} />
                </div>

                {error && (
                    <div role="alert" className="mt-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        <AlertCircle size={18} className="mt-0.5 shrink-0 text-[var(--rf-danger)]" />
                        {error}
                    </div>
                )}

                <section className="mt-6 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 shadow-sm sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-muted)]">Rider</p>
                    <h2 className="mt-1 text-xl font-bold text-[var(--rf-midnight)]">{ride.rider?.name ?? "Rider"}</h2>
                    <div className="mt-7 space-y-4">
                        <Location label="Pickup" value={ride.pickupLocation.label} first />
                        <div className="ml-4 h-6 border-l border-dashed border-[var(--rf-border)]" />
                        <Location label="Destination" value={ride.destinationLocation.label} />
                    </div>
                    <div className="mt-7 grid gap-4 border-t border-[var(--rf-border)] pt-6 sm:grid-cols-3">
                        <Info label="Ride type" value={ride.rideType} />
                        <Info label="Estimated fare" value={`₹${ride.estimatedFare}`} />
                        <Info label="Distance" value={`${ride.estimatedDistanceKm} km`} />
                    </div>
                </section>

                <section className="mt-5 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 shadow-sm sm:p-8">
                    {action && ActionIcon ? (
                        <>
                            <h2 className="font-bold text-[var(--rf-midnight)]">Next step</h2>
                            <p className="mt-1 text-sm text-[var(--rf-muted)]">Update the rider as you progress through this trip.</p>
                            <Button className="mt-5" variant="primary" disabled={updating} onClick={() => void advanceRide()}>
                                {updating ? <><Loader2 size={16} className="animate-spin" />{action.loadingLabel}</> : <><ActionIcon size={16} />{action.label}</>}
                            </Button>

                            {canDriverCancel(ride.status) && (
                                <div className="mt-6 border-t border-[var(--rf-border)] pt-5">
                                    <p className="text-sm text-[var(--rf-muted)]">
                                        Need to cancel before the trip starts?
                                    </p>
                                    <Button className="mt-3" variant="danger" disabled={updating} onClick={() => void cancelRide()}>
                                        {updating ? <><Loader2 size={16} className="animate-spin" />Cancelling ride...</> : <><XCircle size={16} />Cancel ride</>}
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <RideSummary status={ride.status} />
                    )}
                </section>
            </div>
        </main>
    );
}

function BackLink() {
    return <Link href="/driver/rides" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--rf-muted)] hover:text-[var(--rf-green-dark)]"><ArrowLeft size={16} />My rides</Link>;
}

function LoadingState() {
    return <main className="min-h-full bg-[var(--rf-surface-muted)]"><div className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10"><div className="space-y-5"><div className="h-5 w-32 animate-pulse rounded bg-[var(--rf-border)]" /><div className="h-10 w-56 animate-pulse rounded bg-[var(--rf-border)]" /><div className="h-80 animate-pulse rounded-3xl bg-[var(--rf-border)]" /></div></div></main>;
}

function Location({ label, value, first = false }: { label: string; value: string; first?: boolean }) {
    return <div className="flex items-start gap-3"><div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${first ? "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]" : "bg-[var(--rf-midnight)]/5 text-[var(--rf-midnight)]"}`}><MapPin size={16} /></div><div><p className="text-xs font-semibold text-[var(--rf-muted)]">{label}</p><p className="mt-1 text-sm font-semibold text-[var(--rf-midnight)]">{value}</p></div></div>;
}

function Info({ label, value }: { label: string; value: string }) {
    return <div className="rounded-2xl bg-[var(--rf-surface-muted)] p-4"><p className="text-xs font-semibold text-[var(--rf-muted)]">{label}</p><p className="mt-1 text-sm font-bold text-[var(--rf-midnight)]">{value}</p></div>;
}

function RideSummary({ status }: { status: RideStatus }) {
    const completed = status === "COMPLETED";
    return <div className="flex items-start gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${completed ? "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]" : "bg-red-50 text-[var(--rf-danger)]"}`}>{completed ? <CheckCircle2 size={21} /> : <XCircle size={21} />}</div><div><h2 className="font-bold text-[var(--rf-midnight)]">{completed ? "Ride completed" : "Ride cancelled"}</h2><p className="mt-1 text-sm text-[var(--rf-muted)]">{completed ? "This trip is complete. Your availability has been restored." : "This ride is no longer active."}</p></div></div>;
}

function canDriverCancel(status: RideStatus) {
    return status === "DRIVER_ASSIGNED" ||
        status === "DRIVER_ARRIVING";
}

function StatusBadge({ status }: { status: RideStatus }) {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${config.className}`}><Icon size={14} />{config.label}</span>;
}

const STATUS_CONFIG: Record<RideStatus, { label: string; icon: typeof Clock3; className: string }> = {
    REQUESTED: { label: "Requested", icon: Clock3, className: "bg-amber-50 text-amber-700" },
    SEARCHING_DRIVER: { label: "Finding driver", icon: Loader2, className: "bg-blue-50 text-blue-700" },
    DRIVER_ASSIGNED: { label: "Assigned", icon: Car, className: "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]" },
    DRIVER_ARRIVING: { label: "Arriving", icon: Car, className: "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]" },
    IN_PROGRESS: { label: "In progress", icon: PlayCircle, className: "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]" },
    COMPLETED: { label: "Completed", icon: CheckCircle2, className: "bg-gray-100 text-gray-700" },
    CANCELLED: { label: "Cancelled", icon: XCircle, className: "bg-red-50 text-red-700" },
};
