"use client";

import {
    AlertCircle,
    Banknote,
    Check,
    CreditCard,
    Loader2,
    MapPin,
    Smartphone,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useBooking } from "@/context/booking-context";
import { createRide } from "@/lib/rides";
import type { PaymentMethod } from "@/lib/rides";

function PaymentIcon({ method }: { method: PaymentMethod }) {
    if (method === "UPI") return <Smartphone size={16} />;
    if (method === "CARD") return <CreditCard size={16} />;
    return <Banknote size={16} />;
}

export default function ConfirmRidePage() {
    const router = useRouter();

    const {
        pickup,
        destination,
        selectedRide,
        quote,
        paymentMethod,
        resetBooking,
    } = useBooking();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Guard: all required booking state must be present
    const isReady =
        pickup?.locationId &&
        destination?.locationId &&
        pickup.locationId !== destination.locationId &&
        selectedRide &&
        quote &&
        !isSubmitting &&
        paymentMethod;

    if (!destination || !selectedRide || !paymentMethod) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-rf-surface-muted px-6">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
                    <p className="text-sm font-bold text-rf-green">
                        RIDEFLOW
                    </p>

                    <h1 className="mt-3 text-xl font-bold text-rf-text">
                        Your ride isn&apos;t ready yet
                    </h1>

                    <p className="mt-2 text-sm text-rf-muted">
                        Choose a destination, ride type, and payment method before continuing.
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

    async function confirmRide() {
        if (!isReady) {
            if (!quote) {
                setError(
                    "Your fare estimate is missing. Go back and select a ride type.",
                );
            } else if (!pickup?.locationId || !destination?.locationId) {
                setError(
                    "Location information is missing. Please start over.",
                );
            } else if (pickup.locationId === destination.locationId) {
                setError(
                    "Pickup and destination cannot be the same location.",
                );
            } else {
                setError(
                    "Please complete all booking steps before confirming.",
                );
            }
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            /*
             * Send ONLY location IDs, ride type, and payment method.
             * No fare, distance, or duration — the server recalculates those
             * independently and never trusts client-supplied financial values.
             */
            const ride = await createRide({
                pickupLocationId: pickup!.locationId!,
                destinationLocationId: destination!.locationId!,
                rideType: selectedRide!.category,
                paymentMethod: paymentMethod!,
            });

            resetBooking();

            // Navigate without a browser reload; the existing realtime lifecycle
            // (finding-driver → DRIVER_ASSIGNED → ...) continues from here.
            router.push(
                `/rider/finding-driver?rideId=${ride.id}`,
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "We couldn't request your ride. Please try again.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-rf-surface-muted px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-2xl">

                <button
                    type="button"
                    onClick={() => router.push("/rider/payment")}
                    className="text-sm font-semibold text-rf-muted transition hover:text-rf-green"
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

                    <p className="mt-2 text-sm text-rf-muted">
                        Review everything before requesting your ride.
                    </p>

                    {/* Route */}
                    <div className="mt-8 rounded-2xl bg-rf-surface-muted p-5">

                        <p className="text-xs font-bold uppercase tracking-wide text-rf-muted">
                            Trip
                        </p>

                        <div className="mt-4 space-y-4">

                            <div className="flex items-start gap-3">
                                <span
                                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rf-green/10 text-rf-green"
                                    aria-hidden="true"
                                >
                                    <MapPin size={14} />
                                </span>

                                <div>
                                    <p className="text-xs text-rf-muted">Pickup</p>
                                    <p className="mt-0.5 text-sm font-semibold">
                                        {pickup?.label}
                                    </p>
                                </div>
                            </div>

                            <div className="ml-3.5 h-5 w-px bg-rf-border" aria-hidden="true" />

                            <div className="flex items-start gap-3">
                                <span
                                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rf-green text-white"
                                    aria-hidden="true"
                                >
                                    <MapPin size={14} />
                                </span>

                                <div>
                                    <p className="text-xs text-rf-muted">Destination</p>
                                    <p className="mt-0.5 text-sm font-semibold">
                                        {destination.label}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Ride type */}
                    <div className="mt-4 rounded-2xl border border-rf-border p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-rf-muted">Ride</p>
                                <p className="mt-1 text-base font-bold">
                                    {selectedRide.name}
                                </p>
                                <p className="mt-0.5 text-xs text-rf-muted">
                                    {selectedRide.seats} seats
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-rf-muted">Type</p>
                                <p className="mt-1 inline-flex items-center rounded-full bg-rf-green/10 px-2.5 py-1 text-xs font-bold text-rf-green">
                                    {selectedRide.category}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Server-calculated fare — clearly labelled as estimated */}
                    <div className="mt-4 rounded-2xl bg-rf-midnight p-5 text-white">

                        <p className="text-xs font-bold uppercase tracking-wide text-rf-green">
                            Estimated fare
                        </p>

                        {quote ? (
                            <>
                                <div className="mt-3 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold">
                                        ₹{quote.estimatedFare}
                                    </span>
                                    <span className="text-sm text-white/60">INR</span>
                                </div>

                                <div className="mt-3 flex items-center gap-4 text-sm text-white/60">
                                    <span>{quote.estimatedDistanceKm.toFixed(1)} km</span>
                                    <span aria-hidden="true">·</span>
                                    <span>~{quote.estimatedDurationMinutes} min</span>
                                </div>

                                <p className="mt-3 text-xs text-white/40">
                                    Calculated using real road distance and estimated driving time.
                                    Final fare may differ slightly based on the driver&apos;s actual route.
                                </p>
                            </>
                        ) : (
                            <p className="mt-3 text-sm text-white/60">
                                Fare not available — go back and select a ride type.
                            </p>
                        )}

                    </div>

                    {/* Payment method */}
                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-rf-border p-4">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rf-green/10 text-rf-green">
                            <PaymentIcon method={paymentMethod} />
                        </span>

                        <div className="flex-1">
                            <p className="text-xs text-rf-muted">Payment</p>
                            <p className="mt-0.5 text-sm font-semibold">{paymentMethod}</p>
                        </div>

                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rf-green" aria-hidden="true">
                            <Check size={13} className="text-white" />
                        </span>
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            role="alert"
                            aria-live="assertive"
                            className="mt-5 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700"
                        >
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Confirm CTA */}
                    <button
                        type="button"
                        onClick={() => void confirmRide()}
                        disabled={!isReady || isSubmitting}
                        aria-label={
                            isSubmitting
                                ? "Requesting your ride, please wait"
                                : !quote
                                    ? "Fare estimate missing — go back and select a ride"
                                    : "Confirm and request your ride"
                        }
                        className="mt-6 h-14 w-full rounded-2xl bg-rf-green text-sm font-semibold text-white transition hover:bg-rf-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 size={16} className="animate-spin" />
                                Requesting your ride…
                            </span>
                        ) : (
                            "Confirm & request ride"
                        )}
                    </button>

                </section>
            </div>
        </main>
    );
}