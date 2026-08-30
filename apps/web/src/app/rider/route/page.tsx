"use client";

import { useRouter } from "next/navigation";

import { useBooking } from "@/context/booking-context";

export default function RoutePage() {
    const router = useRouter();

    const {
        pickup,
        destination,
        setStep,
    } = useBooking();

    if (!destination) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-rf-surface-muted px-6">
                <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-bold">
                        Choose a destination first
                    </h1>

                    <button
                        type="button"
                        onClick={() =>
                            router.push("/rider/destination")
                        }
                        className="mt-5 rounded-xl bg-rf-green px-5 py-3 text-sm font-semibold text-white"
                    >
                        Choose destination
                    </button>
                </div>
            </main>
        );
    }

    function continueToRideOptions() {
        setStep("ride-options");
        router.push("/rider/ride-options");
    }

    return (
        <main className="min-h-screen bg-rf-surface-muted px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-3xl">

                <button
                    type="button"
                    onClick={() =>
                        router.push("/rider/destination")
                    }
                    className="text-sm font-semibold text-rf-text-secondary hover:text-rf-green"
                >
                    ← Change destination
                </button>

                <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">

                    {/* Map placeholder */}
                    <div className="relative flex h-72 items-center justify-center bg-rf-midnight sm:h-96">
                        <div className="absolute inset-0 opacity-20">
                            <div className="h-full w-full bg-[radial-gradient(circle_at_center,_var(--color-rf-green)_1px,_transparent_1px)] [background-size:24px_24px]" />
                        </div>

                        <div className="relative text-center">
                            <p className="text-xs font-bold uppercase tracking-wider text-rf-green">
                                Route preview
                            </p>

                            <p className="mt-2 text-sm text-white/70">
                                Live map integration comes next.
                            </p>
                        </div>
                    </div>

                    {/* Route details */}
                    <div className="p-6 sm:p-8">

                        <p className="text-sm font-bold text-rf-green">
                            YOUR TRIP
                        </p>

                        <h1 className="mt-2 text-2xl font-bold">
                            Review your route
                        </h1>

                        <div className="mt-6 space-y-3">

                            <div className="rounded-2xl bg-rf-surface-muted p-4">
                                <p className="text-xs text-rf-text-secondary">
                                    Pickup
                                </p>

                                <p className="mt-1 text-sm font-semibold">
                                    {pickup?.label}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-rf-surface-muted p-4">
                                <p className="text-xs text-rf-text-secondary">
                                    Destination
                                </p>

                                <p className="mt-1 text-sm font-semibold">
                                    {destination.label}
                                </p>
                            </div>

                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-rf-text-secondary">
                                    Estimated trip
                                </p>

                                <p className="mt-1 text-sm font-bold">
                                    3.8 km · 12 min
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-rf-text-secondary">
                                    Estimated fare
                                </p>

                                <p className="mt-1 text-sm font-bold">
                                    ₹180–₹220
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={continueToRideOptions}
                            className="mt-8 h-14 w-full rounded-2xl bg-rf-green text-sm font-semibold text-white transition hover:bg-rf-green-dark"
                        >
                            Choose a ride
                        </button>

                    </div>
                </section>
            </div>
        </main>
    );
}