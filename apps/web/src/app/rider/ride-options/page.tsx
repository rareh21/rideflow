"use client";

import {
    AlertCircle,
    ArrowRight,
    Check,
    Loader2,
    MapPin,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useBooking } from "@/context/booking-context";
import { createRideQuote } from "@/lib/rides";
import type { RideQuote, RideType } from "@/lib/rides";

type RideTypeConfig = {
    type: RideType;
    name: string;
    description: string;
    emoji: string;
    seats: number;
    tier: string;
};

const RIDE_TYPE_CONFIGS: RideTypeConfig[] = [
    {
        type: "GO",
        name: "RideFlow Go",
        description: "Everyday rides at a comfortable price",
        emoji: "🚗",
        seats: 4,
        tier: "Standard",
    },
    {
        type: "PLUS",
        name: "RideFlow Plus",
        description: "Extra comfort for your everyday trips",
        emoji: "🚙",
        seats: 4,
        tier: "Comfort",
    },
    {
        type: "XL",
        name: "RideFlow XL",
        description: "More space for groups and luggage",
        emoji: "🚐",
        seats: 6,
        tier: "Large",
    },
];

export default function RideOptionsPage() {
    const router = useRouter();

    const {
        pickup,
        destination,
        selectedRide,
        selectRide,
        setQuote,
    } = useBooking();

    const [selectedType, setSelectedType] = useState<RideType | null>(
        selectedRide?.category as RideType ?? null,
    );

    /*
     * Quote state is LOCAL to this page.
     *
     * Storing the in-flight quote in BookingContext caused an infinite loop:
     *   setQuote(null) → state update → useMemo recomputes context value →
     *   new setQuote reference → useCallback([..., setQuote]) recreates
     *   fetchQuote → useEffect([fetchQuote]) re-fires → setQuote(null) → ...
     *
     * We keep quote as local useState here and only commit it to context
     * via setQuote() once (in handleContinue), so context mutations never
     * re-trigger the fetch effect.
     */
    const [quote, setLocalQuote] = useState<RideQuote | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteError, setQuoteError] = useState<string | null>(null);

    // Holds the AbortController for the in-flight request so stale
    // responses from a previous ride type selection are discarded.
    const quoteAbortRef = useRef<AbortController | null>(null);

    const pickupId = pickup?.locationId;
    const destinationId = destination?.locationId;

    const fetchQuote = useCallback(async (rideType: RideType) => {
        if (!pickupId || !destinationId) {
            return;
        }

        if (pickupId === destinationId) {
            setQuoteError("Pickup and destination cannot be the same location.");
            setLocalQuote(null);
            return;
        }

        // Cancel any in-flight request from a previous selection
        quoteAbortRef.current?.abort();
        const controller = new AbortController();
        quoteAbortRef.current = controller;

        setQuoteLoading(true);
        setQuoteError(null);
        setLocalQuote(null);

        try {
            const result = await createRideQuote({
                pickupLocationId: pickupId,
                destinationLocationId: destinationId,
                rideType,
            });

            if (controller.signal.aborted) {
                return;
            }

            setLocalQuote(result);
        } catch (err) {
            if (controller.signal.aborted) {
                return;
            }

            setQuoteError(
                err instanceof Error
                    ? err.message
                    : "We couldn't get a fare estimate. Please try again.",
            );
        } finally {
            if (!controller.signal.aborted) {
                setQuoteLoading(false);
            }
        }
        // pickupId and destinationId are plain strings — stable across renders
        // unless locations genuinely change. setLocalQuote / setQuoteLoading /
        // setQuoteError are local setState setters — always stable references.
        // No context setters are listed here, so the context can never cause
        // this callback to be recreated.
    }, [pickupId, destinationId]);

    // Re-fetch when the selected ride type changes (or locations change).
    useEffect(() => {
        if (!selectedType) {
            return;
        }

        void fetchQuote(selectedType);

        return () => {
            quoteAbortRef.current?.abort();
        };
    }, [selectedType, fetchQuote]);

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

    function handleSelectType(type: RideType) {
        setSelectedType(type);
        setLocalQuote(null);
        setQuoteError(null);
    }

    function handleContinue() {
        if (!selectedType || !quote || quoteLoading) {
            return;
        }

        const config = RIDE_TYPE_CONFIGS.find((c) => c.type === selectedType)!;

        // Commit the server quote to context once, right before navigating.
        // This is the only time we call the context setter — it does not
        // participate in the fetch loop.
        setQuote(quote);

        selectRide({
            id: selectedType.toLowerCase(),
            category: selectedType,
            name: config.name,
            description: config.description,
            etaMinutes: quote.estimatedDurationMinutes,
            fare: quote.estimatedFare,
            seats: config.seats,
        });

        router.push("/rider/payment");
    }

    const canContinue = !!selectedType && !!quote && !quoteLoading && !quoteError;

    return (
        <main className="min-h-screen bg-rf-surface-muted px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-3xl">

                <button
                    type="button"
                    onClick={() => router.push("/rider/route")}
                    className="text-sm font-semibold text-rf-muted transition hover:text-rf-green"
                >
                    ← Back to route
                </button>

                <section className="mt-6">

                    <div>
                        <p className="text-sm font-bold tracking-wide text-rf-green">
                            RIDEFLOW
                        </p>

                        <h1 className="mt-3 text-3xl font-bold tracking-tight">
                            Choose your ride
                        </h1>

                        <p className="mt-2 text-sm text-rf-muted">
                            Select a ride type to see your estimated fare.
                        </p>
                    </div>

                    {/* Trip summary */}
                    <div className="mt-6 rounded-2xl bg-rf-midnight p-5 text-white">
                        <p className="text-xs font-semibold uppercase tracking-wide text-rf-green">
                            Your trip
                        </p>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-white/60">Pickup</p>
                                <p className="text-sm font-semibold">{pickup?.label}</p>
                            </div>

                            <MapPin
                                size={16}
                                className="hidden shrink-0 text-rf-green sm:block"
                            />

                            <div className="sm:text-right">
                                <p className="text-sm text-white/60">Destination</p>
                                <p className="text-sm font-semibold">{destination.label}</p>
                            </div>
                        </div>
                    </div>

                    {/* Ride type cards */}
                    <div
                        className="mt-6 space-y-3"
                        role="radiogroup"
                        aria-label="Ride type"
                    >
                        {RIDE_TYPE_CONFIGS.map((config) => {
                            const isSelected = selectedType === config.type;
                            const isCurrentQuote =
                                isSelected && quote && !quoteLoading && !quoteError;

                            return (
                                <button
                                    key={config.type}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    onClick={() => handleSelectType(config.type)}
                                    className={[
                                        "w-full rounded-3xl border bg-white p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-green focus-visible:ring-offset-2",
                                        isSelected
                                            ? "border-rf-green ring-4 ring-rf-green/10"
                                            : "border-rf-border hover:border-rf-green hover:shadow-sm",
                                    ].join(" ")}
                                >
                                    <div className="flex items-start gap-4">

                                        {/* Vehicle icon */}
                                        <div
                                            className={[
                                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl",
                                                isSelected
                                                    ? "bg-rf-green"
                                                    : "bg-rf-green/10",
                                            ].join(" ")}
                                            aria-hidden="true"
                                        >
                                            {config.emoji}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h2 className="text-base font-bold">
                                                        {config.name}
                                                    </h2>

                                                    <p className="mt-0.5 text-xs text-rf-muted">
                                                        {config.description}
                                                    </p>
                                                </div>

                                                {/* Fare — from server quote only */}
                                                <div className="text-right">
                                                    {isSelected && quoteLoading ? (
                                                        <div className="flex items-center gap-1.5 text-rf-muted">
                                                            <Loader2 size={14} className="animate-spin" />
                                                            <span className="text-xs">Loading…</span>
                                                        </div>
                                                    ) : isCurrentQuote ? (
                                                        <div>
                                                            <p className="text-base font-bold">
                                                                ₹{quote.estimatedFare}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-rf-muted">
                                                                {quote.estimatedDurationMinutes} min
                                                            </p>
                                                        </div>
                                                    ) : !isSelected ? (
                                                        <p className="text-xs text-rf-muted">
                                                            Select to see fare
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center gap-4 text-xs text-rf-muted">
                                                <span>{config.seats} seats</span>
                                                <span aria-hidden="true">•</span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-rf-green/10 px-2 py-0.5 text-xs font-semibold text-rf-green">
                                                    {config.tier}
                                                </span>
                                            </div>

                                            {/* Distance / ETA strip — only after quote resolves */}
                                            {isCurrentQuote && (
                                                <div className="mt-3 flex items-center gap-3 rounded-xl bg-rf-surface-muted px-3 py-2 text-xs text-rf-muted">
                                                    <span>
                                                        {quote.estimatedDistanceKm.toFixed(1)} km
                                                    </span>
                                                    <span aria-hidden="true">·</span>
                                                    <span>~{quote.estimatedDurationMinutes} min</span>
                                                    <span aria-hidden="true">·</span>
                                                    <span className="font-medium text-rf-green">
                                                        Estimated fare
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {isSelected && (
                                            <div
                                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rf-green"
                                                aria-hidden="true"
                                            >
                                                <Check size={13} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Quote error */}
                    {quoteError && (
                        <div
                            role="alert"
                            className="mt-4 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700"
                        >
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <span>{quoteError}</span>
                        </div>
                    )}

                    {/* Disclaimer */}
                    <div className="mt-5 rounded-2xl bg-rf-green/5 p-4">
                        <p className="text-xs font-semibold text-rf-text">
                            Estimated fares only
                        </p>

                        <p className="mt-1 text-xs text-rf-muted">
                            Fares are calculated using straight-line distance and average city speed.
                            Final fare may differ once your driver&apos;s route is confirmed.
                        </p>
                    </div>

                    {/* Continue */}
                    <button
                        type="button"
                        onClick={handleContinue}
                        disabled={!canContinue}
                        aria-label={
                            !selectedType
                                ? "Select a ride type to continue"
                                : quoteLoading
                                    ? "Getting your fare estimate…"
                                    : "Continue to payment"
                        }
                        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-rf-green text-sm font-semibold text-white transition hover:bg-rf-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {quoteLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Getting fare estimate…
                            </>
                        ) : (
                            <>
                                {selectedType && quote
                                    ? `Continue — ₹${quote.estimatedFare}`
                                    : "Select a ride type"}
                                {canContinue && <ArrowRight size={16} />}
                            </>
                        )}
                    </button>

                </section>
            </div>
        </main>
    );
}