"use client";

import { useRouter } from "next/navigation";

import { useBooking } from "@/context/booking-context";

export default function ConfirmRidePage() {
    const router = useRouter();

    const {
        pickup,
        destination,
        selectedRide,
    } = useBooking();

    if (!destination || !selectedRide) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-rf-surface-muted px-6">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
                    <p className="text-sm font-bold text-rf-green">
                        RIDEFLOW
                    </p>

                    <h1 className="mt-3 text-xl font-bold text-rf-text">
                        Your ride isn't ready yet
                    </h1>

                    <p className="mt-2 text-sm text-rf-text-secondary">
                        Choose a destination and ride before continuing.
                    </p>

                    <button
                        type="button"
                        onClick={() => router.push("/rider")}
                        className="mt-6 rounded-xl bg-rf-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-rf-green-dark"
                    >
                        Back to RideFlow
                    </button>
                </div>
            </main>
        );
    }

    function confirmRide() {
        router.push("/rider/finding-driver");
    }

    return (
        <main className="min-h-screen bg-rf-surface-muted px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-2xl">

                <button
                    type="button"
                    onClick={() => router.push("/rider/payment")}
                    className="text-sm font-semibold text-rf-text-secondary transition hover:text-rf-green"
                >
                    ← Back to payment
                </button>

                <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">

                    <p className="text-sm font-bold tracking-wide text-rf-green">
                        RIDEFLOW
                    </p>

                    <h1 className="mt-3 text-3xl font-bold tracking-tight">
                        Confirm your ride
                    </h1>

                    <p className="mt-2 text-sm text-rf-text-secondary">
                        Review everything before requesting your ride.
                    </p>

                    {/* Route */}
                    <div className="mt-8 rounded-2xl bg-rf-surface-muted p-5">

                        <p className="text-xs font-bold uppercase tracking-wide text-rf-text-secondary">
                            Trip
                        </p>

                        <div className="mt-4 space-y-4">

                            <div>
                                <p className="text-xs text-rf-text-secondary">
                                    Pickup
                                </p>

                                <p className="mt-1 text-sm font-semibold">
                                    {pickup?.label}
                                </p>
                            </div>

                            <div className="h-px bg-rf-border" />

                            <div>
                                <p className="text-xs text-rf-text-secondary">
                                    Destination
                                </p>

                                <p className="mt-1 text-sm font-semibold">
                                    {destination.label}
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* Ride */}
                    <div className="mt-4 rounded-2xl border border-rf-border p-5">

                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-xs text-rf-text-secondary">
                                    Ride
                                </p>

                                <p className="mt-1 text-base font-bold">
                                    {selectedRide.name}
                                </p>

                                <p className="mt-1 text-xs text-rf-text-secondary">
                                    {selectedRide.seats} seats ·{" "}
                                    {selectedRide.etaMinutes} min pickup
                                </p>
                            </div>

                            <p className="text-xl font-bold">
                                ₹{selectedRide.fare}
                            </p>

                        </div>

                    </div>

                    {/* Fare */}
                    <div className="mt-4 rounded-2xl bg-rf-midnight p-5 text-white">

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white/60">
                                Estimated fare
                            </span>

                            <span className="text-lg font-bold">
                                ₹{selectedRide.fare}
                            </span>
                        </div>

                        <p className="mt-2 text-xs text-white/50">
                            Final fare may vary based on the actual trip.
                        </p>

                    </div>

                    {/* Confirm */}
                    <button
                        type="button"
                        onClick={confirmRide}
                        className="mt-6 h-14 w-full rounded-2xl bg-rf-green text-sm font-semibold text-white transition hover:bg-rf-green-dark"
                    >
                        Confirm & request ride
                    </button>

                </section>
            </div>
        </main>
    );
}