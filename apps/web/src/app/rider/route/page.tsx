"use client";

import {
    AlertCircle,
    ArrowRight,
    Banknote,
    Check,
    ChevronDown,
    ChevronUp,
    CreditCard,
    Loader2,
    MapPin,
    Smartphone,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useBooking } from "@/context/booking-context";
import { createRide, createRideQuote } from "@/lib/rides";
import type { PaymentMethod, RideQuote, RideType } from "@/lib/rides";
import { getUserPreferences } from "@/lib/users";
import { RouteMap } from "@/components/route-map";

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

type PaymentOption = {
    method: PaymentMethod;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
};

const PAYMENT_OPTIONS: PaymentOption[] = [
    {
        method: "UPI",
        label: "UPI",
        subtitle: "Pay via any UPI app",
        icon: <Smartphone size={18} />,
    },
    {
        method: "CARD",
        label: "Card",
        subtitle: "Credit or debit card",
        icon: <CreditCard size={18} />,
    },
    {
        method: "CASH",
        label: "Cash",
        subtitle: "Pay the driver directly",
        icon: <Banknote size={18} />,
    },
];

/**
 * Integrated Route & Vehicle Options page.
 *
 * Combines Route Preview, Vehicle selection with server-calculated fares,
 * Payment Method handling, and Ride Confirmation into a single streamlined step.
 */
export default function RoutePage() {
    const router = useRouter();

    const {
        pickup,
        destination,
        paymentMethod: contextPaymentMethod,
        setPaymentMethod: setContextPaymentMethod,
        resetBooking,
    } = useBooking();

    const [quotes, setQuotes] = useState<Record<RideType, RideQuote> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedType, setSelectedType] = useState<RideType>("GO");
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(
        contextPaymentMethod || "UPI",
    );
    const [showPaymentSelection, setShowPaymentSelection] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const abortRef = useRef<AbortController | null>(null);

    const pickupId = pickup?.locationId;
    const destinationId = destination?.locationId;

    // Load default payment preference from user profile if not set in context
    useEffect(() => {
        if (contextPaymentMethod) {
            setSelectedPayment(contextPaymentMethod);
            return;
        }
        getUserPreferences()
            .then((prefs) => {
                if (prefs.defaultPaymentMethod) {
                    setSelectedPayment(prefs.defaultPaymentMethod);
                    setContextPaymentMethod(prefs.defaultPaymentMethod);
                }
            })
            .catch(() => {
                // Preference load failure is non-critical
            });
    }, [contextPaymentMethod, setContextPaymentMethod]);

    const fetchQuotes = useCallback(async () => {
        if (!pickupId || !destinationId) {
            return;
        }

        if (pickupId === destinationId) {
            setError("Please choose a different destination.");
            setQuotes(null);
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);

        try {
            const [goQuote, plusQuote, xlQuote] = await Promise.all([
                createRideQuote({
                    pickupLocationId: pickupId,
                    destinationLocationId: destinationId,
                    rideType: "GO",
                }),
                createRideQuote({
                    pickupLocationId: pickupId,
                    destinationLocationId: destinationId,
                    rideType: "PLUS",
                }),
                createRideQuote({
                    pickupLocationId: pickupId,
                    destinationLocationId: destinationId,
                    rideType: "XL",
                }),
            ]);

            if (controller.signal.aborted) {
                return;
            }

            setQuotes({
                GO: goQuote,
                PLUS: plusQuote,
                XL: xlQuote,
            });
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

    useEffect(() => {
        void fetchQuotes();

        return () => {
            abortRef.current?.abort();
        };
    }, [fetchQuotes]);

    if (!destination) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-rf-surface-muted px-6">
                <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-bold text-rf-text">
                        Choose a destination first
                    </h1>

                    <button
                        type="button"
                        onClick={() => router.push("/rider/destination")}
                        className="mt-5 rounded-xl bg-rf-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-rf-green-dark"
                    >
                        Choose destination
                    </button>
                </div>
            </main>
        );
    }

    function handlePaymentSelect(method: PaymentMethod) {
        setSelectedPayment(method);
        setContextPaymentMethod(method);
        setShowPaymentSelection(false);
    }

    async function handleConfirmRide() {
        if (!pickupId || !destinationId || !selectedType || !selectedPayment || isSubmitting) {
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const ride = await createRide({
                pickupLocationId: pickupId,
                destinationLocationId: destinationId,
                rideType: selectedType,
                paymentMethod: selectedPayment,
            });

            resetBooking();
            router.push(`/rider/finding-driver?rideId=${ride.id}`);
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

    const currentQuote = quotes ? quotes[selectedType] : null;
    const activePaymentConfig = PAYMENT_OPTIONS.find(
        (p) => p.method === selectedPayment,
    ) || PAYMENT_OPTIONS[0];

    const canConfirm = !loading && !error && !!currentQuote && !isSubmitting;

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

                    {/* Interactive Route Map */}
                    <div className="relative h-72 w-full overflow-hidden bg-rf-midnight sm:h-80">
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
                        ) : currentQuote ? (
                            <RouteMap
                                pickup={currentQuote.pickupLocation}
                                destination={currentQuote.destinationLocation}
                                encodedPolyline={currentQuote.encodedPolyline}
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

                    {/* Route Details & Vehicle Options */}
                    <div className="p-6 sm:p-8">

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-rf-green">
                                    Your trip
                                </p>
                                <h1 className="mt-1 text-2xl font-bold">
                                    Route & Vehicle Options
                                </h1>
                            </div>

                            {currentQuote && !loading && (
                                <div className="text-right">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rf-green/10 px-3 py-1 text-xs font-bold text-rf-green">
                                        {currentQuote.estimatedDistanceKm.toFixed(1)} km · ~{currentQuote.estimatedDurationMinutes} min
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Pickup → Destination summary */}
                        <div className="mt-5 space-y-3 rounded-2xl bg-rf-surface-muted p-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rf-green/10 text-rf-green">
                                    <MapPin size={13} />
                                </span>
                                <p className="text-sm font-medium text-rf-text truncate">
                                    {pickup?.label && !pickup.label.includes("(")
                                        ? pickup.label
                                        : "Current location · Hyderabad"}
                                </p>
                            </div>
                            <div className="ml-3 h-3 w-px bg-rf-border" aria-hidden="true" />
                            <div className="flex items-center gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rf-green text-white">
                                    <MapPin size={13} />
                                </span>
                                <p className="text-sm font-semibold text-rf-text truncate">
                                    {destination.label}
                                </p>
                            </div>
                        </div>

                        {/* Error state if route calculation failed */}
                        {!loading && error && (
                            <div role="alert" className="mt-4 rounded-2xl bg-red-50 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-red-700">Route Error</p>
                                        <p className="mt-0.5 text-xs text-red-600">{error}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void fetchQuotes()}
                                    className="mt-3 text-xs font-semibold text-red-700 underline underline-offset-2"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {/* Vehicle Options Section */}
                        <div className="mt-6">
                            <h2 className="text-sm font-bold tracking-wide text-rf-text">
                                SELECT RIDE TYPE
                            </h2>

                            <div className="mt-3 space-y-3" role="radiogroup" aria-label="Ride type">
                                {RIDE_TYPE_CONFIGS.map((config) => {
                                    const isSelected = selectedType === config.type;
                                    const quoteForType = quotes ? quotes[config.type] : null;

                                    return (
                                        <button
                                            key={config.type}
                                            type="button"
                                            role="radio"
                                            aria-checked={isSelected}
                                            onClick={() => setSelectedType(config.type)}
                                            className={[
                                                "w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-green",
                                                isSelected
                                                    ? "border-rf-green bg-rf-green/5 ring-2 ring-rf-green/20"
                                                    : "border-rf-border hover:border-rf-green/50 hover:bg-rf-surface-muted/50",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Icon */}
                                                <div
                                                    className={[
                                                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl",
                                                        isSelected ? "bg-rf-green text-white" : "bg-rf-surface-muted text-rf-muted",
                                                    ].join(" ")}
                                                >
                                                    {config.emoji}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h3 className="text-base font-bold text-rf-text">
                                                            {config.name}
                                                        </h3>

                                                        {/* Fare */}
                                                        {loading ? (
                                                            <div className="flex items-center gap-1 text-rf-muted">
                                                                <Loader2 size={13} className="animate-spin" />
                                                                <span className="text-xs">Calculating…</span>
                                                            </div>
                                                        ) : quoteForType ? (
                                                            <div className="text-right">
                                                                <span className="text-base font-bold text-rf-text">
                                                                    ₹{quoteForType.estimatedFare}
                                                                </span>
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <div className="mt-1 flex items-center justify-between text-xs text-rf-muted">
                                                        <span>{config.description}</span>
                                                        {quoteForType && (
                                                            <span>~{quoteForType.estimatedDurationMinutes} min</span>
                                                        )}
                                                    </div>

                                                    <div className="mt-2 flex items-center gap-2 text-xs">
                                                        <span className="rounded-md bg-rf-surface-muted px-2 py-0.5 font-medium text-rf-text-secondary">
                                                            {config.seats} seats
                                                        </span>
                                                        <span className="rounded-md bg-rf-green/10 px-2 py-0.5 font-semibold text-rf-green">
                                                            {config.tier}
                                                        </span>
                                                    </div>
                                                </div>

                                                {isSelected && (
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rf-green text-white">
                                                        <Check size={13} />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Payment Method Bar */}
                        <div className="mt-6 rounded-2xl border border-rf-border p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rf-green/10 text-rf-green">
                                        {activePaymentConfig.icon}
                                    </span>
                                    <div>
                                        <p className="text-xs text-rf-muted">Payment method</p>
                                        <p className="text-sm font-bold text-rf-text">
                                            {activePaymentConfig.label} ({activePaymentConfig.subtitle})
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowPaymentSelection(!showPaymentSelection)}
                                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-rf-green transition hover:bg-rf-green/10"
                                >
                                    <span>{showPaymentSelection ? "Done" : "Change"}</span>
                                    {showPaymentSelection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                            </div>

                            {/* Expanded Payment Options */}
                            {showPaymentSelection && (
                                <div className="mt-4 space-y-2 border-t border-rf-border pt-4" role="radiogroup" aria-label="Payment method">
                                    {PAYMENT_OPTIONS.map(({ method, label, subtitle, icon }) => {
                                        const isSelected = selectedPayment === method;

                                        return (
                                            <button
                                                key={method}
                                                type="button"
                                                role="radio"
                                                aria-checked={isSelected}
                                                onClick={() => handlePaymentSelect(method)}
                                                className={[
                                                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                                                    isSelected
                                                        ? "border-rf-green bg-rf-green/5 font-semibold"
                                                        : "border-rf-border hover:border-rf-green/50",
                                                ].join(" ")}
                                            >
                                                <span
                                                    className={[
                                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                                        isSelected ? "bg-rf-green text-white" : "bg-rf-surface-muted text-rf-muted",
                                                    ].join(" ")}
                                                >
                                                    {icon}
                                                </span>

                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold">{label}</p>
                                                    <p className="text-xs text-rf-muted">{subtitle}</p>
                                                </div>

                                                {isSelected && (
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rf-green text-white">
                                                        <Check size={11} />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Primary Confirm & Request CTA */}
                        <button
                            type="button"
                            onClick={() => void handleConfirmRide()}
                            disabled={!canConfirm}
                            aria-label={
                                isSubmitting
                                    ? "Requesting your ride..."
                                    : loading
                                        ? "Calculating fares..."
                                        : error
                                            ? "Route error"
                                            : `Confirm ride for ₹${currentQuote?.estimatedFare ?? ""}`
                            }
                            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-rf-green text-sm font-semibold text-white transition hover:bg-rf-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Requesting your ride…
                                </>
                            ) : loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Calculating fares…
                                </>
                            ) : (
                                <>
                                    Confirm Ride · ₹{currentQuote ? currentQuote.estimatedFare : "—"}
                                    {canConfirm && <ArrowRight size={16} />}
                                </>
                            )}
                        </button>

                    </div>
                </section>
            </div>
        </main>
    );
}