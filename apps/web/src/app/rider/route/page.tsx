"use client";

import {
    AlertCircle,
    ArrowRight,
    Loader2,
    MapPin,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useBooking } from "@/context/booking-context";
import { createRideQuote } from "@/lib/rides";
import type { RideQuote } from "@/lib/rides";
import { RouteMap } from "@/components/route-map";

/**
 * Route Preview page — the step between destination selection and ride-type
 * selection.
 *
 * Fetches real road distance, driving ETA, and an initial GO-fare estimate
 * from the server (Google Routes API). The rider's ride-type choice and
 * per-type fare are handled on the next page.
 *
 * Stale-quote protection: whenever pickup or destination locationId changes,
 * any previous result is cleared and a fresh request is fired.
 */
export default function RoutePage() {
    const router = useRouter();

    const { pickup, destination, setStep } = useBooking();

    const [routeQuote, setRouteQuote] = useState<RideQuote | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track the currently in-flight abort controller so stale responses are
    // discarded when locations change.
    const abortRef = useRef<AbortController | null>(null);

    const pickupId = pickup?.locationId;
    const destinationId = destination?.locationId;

    const fetchRoute = useCallback(async () => {
        if (!pickupId || !destinationId) {
            return;
        }

        if (pickupId === destinationId) {
            setError(
                "Please choose a different destination.",
            );
            setRouteQuote(null);
            return;
        }

        // Cancel any in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);
        setRouteQuote(null);

        try {
            // Use GO type for the route preview — it gives us real road
            // distance + ETA. The rider chooses their actual type on the
            // next page where per-type fares are shown.
            const result = await createRideQuote({
                pickupLocationId: pickupId,
                destinationLocationId: destinationId,
                rideType: "GO",
            });

            if (controller.signal.aborted) {
                return;
            }

            setRouteQuote(result);
        } catch (err) {
            if (controller.signal.aborted) {
                return;
            }

            const message =
                err instanceof Error
                    ? err.message
                    : "We couldn't calculate a route between these locations.";

            setError(message);
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    }, [pickupId, destinationId]);

    // Re-fetch whenever pickup or destination changes.
    useEffect(() => {
        void fetchRoute();

        return () => {
            abortRef.current?.abort();
        };
    }, [fetchRoute]);

    // Guard: destination is required to reach this page.
    if (!destination) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-rf-surface-muted px-6">
                <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-bold">
                        Choose a destination first
                    </h1>

                    <button
                        type="button"
                        onClick={() => router.push("/rider/destination")}
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

    const canContinue = !!routeQuote && !loading && !error;

    return (
        <main className="min-h-screen bg-rf-surface-muted px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-3xl">

                <button
                    type="button"
                    onClick={() => router.push("/rider/destination")}
                    className="text-sm font-semibold text-rf-muted transition hover:text-rf-green"
                >
                    ← Change destination
                </button>

                <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">

                    {/* Map area */}
                    <div className="relative h-72 w-full overflow-hidden bg-rf-midnight sm:h-96">
                        {loading ? (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                                <Loader2
                                    size={28}
                                    className="animate-spin text-rf-green"
                                />
                                <p className="text-sm font-semibold text-white/80">
                                    Calculating route…
                                </p>
                            </div>
                        ) : error ? (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                                <AlertCircle size={28} className="text-rf-danger" />
                                <p className="text-sm font-semibold text-white/80">
                                    Route unavailable
                                </p>
                            </div>
                        ) : routeQuote ? (
                            <RouteMap
                                pickup={routeQuote.pickupLocation}
                                destination={routeQuote.destinationLocation}
                                encodedPolyline={routeQuote.encodedPolyline}
                            />
                        ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                                <Loader2 size={28} className="animate-spin text-rf-green" />
                                <p className="text-sm font-semibold text-white/80">
                                    Loading your route…
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Route details */}
                    <div className="p-6 sm:p-8">

                        <p className="text-sm font-bold text-rf-green">
                            YOUR TRIP
                        </p>

                        <h1 className="mt-2 text-2xl font-bold">
                            Review your route
                        </h1>

                        {/* Pickup → Destination */}
                        <div className="mt-6 space-y-0">

                            <div className="flex items-start gap-3">
                                <span
                                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rf-green/10 text-rf-green"
                                    aria-hidden="true"
                                >
                                    <MapPin size={14} />
                                </span>

                                <div className="rounded-2xl bg-rf-surface-muted p-4 flex-1">
                                    <p className="mt-1 text-sm font-semibold">
                                        {pickup?.label && !pickup.label.includes("(")
                                            ? pickup.label
                                            : "Current location · Hyderabad"}
                                    </p>
                                </div>
                            </div>

                            {/* Route connector line */}
                            <div className="ml-3.5 flex flex-col items-center">
                                <div className="w-px flex-1 bg-rf-border" style={{ height: "2rem" }} aria-hidden="true" />
                                {routeQuote && !loading && (
                                    <span className="my-1 rounded-full bg-rf-green/10 px-2.5 py-0.5 text-xs font-semibold text-rf-green">
                                        {routeQuote.estimatedDistanceKm.toFixed(1)} km
                                    </span>
                                )}
                                <div className="w-px flex-1 bg-rf-border" style={{ height: "2rem" }} aria-hidden="true" />
                            </div>

                            <div className="flex items-start gap-3">
                                <span
                                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rf-green text-white"
                                    aria-hidden="true"
                                >
                                    <MapPin size={14} />
                                </span>

                                <div className="rounded-2xl bg-rf-surface-muted p-4 flex-1">
                                    <p className="text-xs text-rf-muted">Destination</p>
                                    <p className="mt-1 text-sm font-semibold">
                                        {destination.label}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Route metrics — loading / error / success */}
                        <div className="mt-6">
                            {loading && (
                                <div
                                    role="status"
                                    aria-live="polite"
                                    className="flex items-center gap-3 rounded-2xl bg-rf-surface-muted p-4"
                                >
                                    <Loader2 size={16} className="animate-spin shrink-0 text-rf-green" />
                                    <p className="text-sm font-medium text-rf-muted">
                                        Calculating route…
                                    </p>
                                </div>
                            )}

                            {!loading && error && (
                                <div
                                    role="alert"
                                    aria-live="assertive"
                                    className="rounded-2xl bg-red-50 p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <AlertCircle
                                            size={16}
                                            className="mt-0.5 shrink-0 text-red-600"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-red-700">
                                                {error.includes("different destination")
                                                    ? "Invalid location"
                                                    : "We couldn't calculate a route"}
                                            </p>
                                            <p className="mt-1 text-xs text-red-600">
                                                {error.includes("different destination")
                                                    ? "Please choose a different destination."
                                                    : "We couldn't calculate a route between these locations. Please try again."}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => void fetchRoute()}
                                        className="mt-3 text-xs font-semibold text-red-700 underline underline-offset-2"
                                    >
                                        Try again
                                    </button>
                                </div>
                            )}

                            {!loading && !error && routeQuote && (
                                <div className="flex items-center justify-between rounded-2xl bg-rf-midnight p-5 text-white">
                                    <div>
                                        <p className="text-xs text-white/60">
                                            Estimated arrival
                                        </p>
                                        <p className="mt-1 text-base font-bold">
                                            ~{routeQuote.estimatedDurationMinutes} min
                                        </p>
                                    </div>

                                    <div className="h-8 w-px bg-white/20" aria-hidden="true" />

                                    <div>
                                        <p className="text-xs text-white/60">
                                            Road distance
                                        </p>
                                        <p className="mt-1 text-base font-bold">
                                            {routeQuote.estimatedDistanceKm.toFixed(1)} km
                                        </p>
                                    </div>

                                    <div className="h-8 w-px bg-white/20" aria-hidden="true" />

                                    <div className="text-right">
                                        <p className="text-xs text-white/60">
                                            From
                                        </p>
                                        <p className="mt-1 text-base font-bold text-rf-green">
                                            ₹{routeQuote.estimatedFare}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={continueToRideOptions}
                            disabled={!canContinue}
                            aria-label={
                                loading
                                    ? "Calculating route, please wait"
                                    : error
                                        ? "Route unavailable — fix the error before continuing"
                                        : "Choose a ride type"
                            }
                            className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-rf-green text-sm font-semibold text-white transition hover:bg-rf-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Calculating route…
                                </>
                            ) : (
                                <>
                                    Choose a ride
                                    {canContinue && <ArrowRight size={16} />}
                                </>
                            )}
                        </button>

                    </div>
                </section>
            </div>
        </main>
    );
}