"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { getRide } from "@/lib/rides";
import type { Ride } from "@/lib/rides";

export default function FindingDriverPage() {
    const searchParams = useSearchParams();

    const rideId = searchParams.get("rideId") ?? "";

    const [ride, setRide] = useState<Ride | null>(
        null,
    );

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(
        null,
    );

    useEffect(() => {
        if (!rideId) {
            setError("Ride ID is missing.");
            setLoading(false);
            return;
        }

        async function loadRide() {
            try {
                const response = await getRide(rideId);

                setRide(response);
            } catch {
                setError(
                    "We couldn't load your ride.",
                );
            } finally {
                setLoading(false);
            }
        }

        void loadRide();
    }, [rideId]);

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
                    We're matching you with the right driver.
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

            </section>
        </main>
    );
}