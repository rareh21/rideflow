"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { cancelRide, getRide } from "@/lib/rides";
import type { Ride } from "@/lib/rides";
import { subscribeToRideUpdates } from "@/lib/ride-realtime";

export default function FindingDriverPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const rideId = searchParams.get("rideId") ?? "";

    const [ride, setRide] = useState<Ride | null>(
        null,
    );

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(
        null,
    );

    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (!rideId) {
            setError("Ride ID is missing.");
            setLoading(false);
            return;
        }

        let active = true;

        async function loadRide() {
            try {
                const response = await getRide(rideId);

                if (!active) {
                    return;
                }

                setRide(response);

                if (response.status !== "SEARCHING_DRIVER") {
                    router.replace(`/rider/rides/${response.id}`);
                }
            } catch {
                if (active) {
                    setError(
                        "We couldn't load your ride.",
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadRide();

        const unsubscribe = subscribeToRideUpdates(
            (event) => {
                if (!active || event.rideId !== rideId) {
                    return;
                }

                setRide(event.ride);

                if (event.status !== "SEARCHING_DRIVER") {
                    router.replace(`/rider/rides/${event.rideId}`);
                }
            },
            () => {
                // Reconcile after every connection/reconnection. This closes the
                // race where a driver accepts between the initial REST load and
                // the rider socket becoming ready.
                void loadRide();
            },
        );

        return () => {
            active = false;
            unsubscribe();
        };
    }, [rideId, router]);

    async function handleCancel() {
        if (!ride || cancelling) {
            return;
        }

        try {
            setCancelling(true);
            setError(null);

            const updatedRide = await cancelRide(ride.id);

            router.replace(`/rider/rides/${updatedRide.id}`);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "We couldn't cancel your ride. Please try again.",
            );
        } finally {
            setCancelling(false);
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-rf-midnight px-6">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-rf-green/20 border-t-rf-green" />

                    <p className="mt-5 text-sm font-medium text-white">
                        Loading your ride...
                    </p>
                </div>
            </main>
        );
    }

    if (error || !ride) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-rf-midnight px-6">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center">
                    <p className="text-sm font-bold text-rf-green">
                        RIDEFLOW
                    </p>

                    <h1 className="mt-3 text-xl font-bold">
                        Something went wrong
                    </h1>

                    <p className="mt-2 text-sm text-rf-text-secondary">
                        {error ?? "Ride not found."}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-rf-midnight px-6">
            <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rf-green/10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-rf-green/20 border-t-rf-green" />
                </div>

                <p className="mt-8 text-sm font-bold tracking-wide text-rf-green">
                    RIDEFLOW
                </p>

                <h1 className="mt-3 text-2xl font-bold">
                    Finding your ride
                </h1>

                <p className="mt-2 text-sm text-rf-text-secondary">
                    We&apos;re matching you with the right driver. This screen updates automatically.
                </p>

                <div className="mt-8 rounded-2xl bg-rf-surface-muted p-5 text-left">

                    <div className="flex justify-between">
                        <span className="text-xs text-rf-text-secondary">
                            Ride
                        </span>

                        <span className="text-sm font-semibold">
                            {ride.rideType}
                        </span>
                    </div>

                    <div className="mt-4 flex justify-between">
                        <span className="text-xs text-rf-text-secondary">
                            Status
                        </span>

                        <span className="text-sm font-semibold text-rf-green">
                            {ride.status}
                        </span>
                    </div>

                    <div className="mt-4 flex justify-between">
                        <span className="text-xs text-rf-text-secondary">
                            Estimated fare
                        </span>

                        <span className="text-sm font-semibold">
                            ₹{ride.estimatedFare}
                        </span>
                    </div>

                </div>

                {error && (
                    <p role="alert" className="mt-4 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => void handleCancel()}
                    className="mt-6 text-sm font-semibold text-rf-danger transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {cancelling ? "Cancelling ride..." : "Cancel ride"}
                </button>

                <Link
                    href={`/rider/rides/${ride.id}`}
                    className="mt-4 block text-sm font-semibold text-rf-green"
                >
                    View ride details
                </Link>

            </section>
        </main>
    );
}
