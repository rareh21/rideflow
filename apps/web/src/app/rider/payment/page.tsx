"use client";

import {
    Banknote,
    Check,
    CreditCard,
    Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useBooking } from "@/context/booking-context";
import { getUserPreferences } from "@/lib/users";
import type { PaymentMethod } from "@/lib/rides";

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
        icon: <Smartphone size={20} />,
    },
    {
        method: "CARD",
        label: "Card",
        subtitle: "Credit or debit card",
        icon: <CreditCard size={20} />,
    },
    {
        method: "CASH",
        label: "Cash",
        subtitle: "Pay the driver directly",
        icon: <Banknote size={20} />,
    },
];

export default function PaymentPage() {
    const router = useRouter();

    const {
        destination,
        selectedRide,
        quote,
        paymentMethod,
        setPaymentMethod,
        setStep,
    } = useBooking();

    const [selected, setSelected] = useState<PaymentMethod | null>(
        paymentMethod ?? null,
    );

    // Load the rider's default payment preference and apply it as the initial
    // selection if nothing has been chosen yet in this booking session.
    useEffect(() => {
        if (selected !== null) {
            return;
        }

        getUserPreferences()
            .then((prefs) => {
                if (!selected) {
                    setSelected(prefs.defaultPaymentMethod);
                }
            })
            .catch(() => {
                // Preference load failure is non-critical; rider can still
                // manually select a payment method.
            });
    }, []);

    if (!destination || !selectedRide) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-rf-surface-muted px-6">
                <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-bold">
                        Choose a ride first
                    </h1>

                    <button
                        type="button"
                        onClick={() =>
                            router.push("/rider/ride-options")
                        }
                        className="mt-5 rounded-xl bg-rf-green px-5 py-3 text-sm font-semibold text-white"
                    >
                        Choose a ride
                    </button>
                </div>
            </main>
        );
    }

    function handleSelect(method: PaymentMethod) {
        setSelected(method);
    }

    function handleContinue() {
        if (!selected) {
            return;
        }

        setPaymentMethod(selected);
        setStep("confirm");
        router.push("/rider/confirm");
    }

    const estimatedFare = quote?.estimatedFare ?? selectedRide.fare;

    return (
        <main className="min-h-screen bg-rf-surface-muted px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-2xl">

                <button
                    type="button"
                    onClick={() =>
                        router.push("/rider/ride-options")
                    }
                    className="text-sm font-semibold text-rf-muted hover:text-rf-green"
                >
                    ← Change ride
                </button>

                <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">

                    <p className="text-sm font-bold text-rf-green">
                        PAYMENT
                    </p>

                    <h1 className="mt-3 text-3xl font-bold">
                        Choose payment
                    </h1>

                    <p className="mt-2 text-sm text-rf-muted">
                        Simple, transparent payment. No hidden fees.
                    </p>

                    {/* Selected ride summary */}
                    <div className="mt-8 rounded-2xl bg-rf-surface-muted p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold">{selectedRide.name}</p>

                                <p className="mt-1 text-xs text-rf-muted">
                                    To {destination.label}
                                </p>

                                {quote && (
                                    <p className="mt-0.5 text-xs text-rf-muted">
                                        {quote.estimatedDistanceKm.toFixed(1)} km
                                        {" · "}
                                        ~{quote.estimatedDurationMinutes} min
                                    </p>
                                )}
                            </div>

                            <div className="text-right">
                                <p className="text-lg font-bold">₹{estimatedFare}</p>
                                <p className="mt-0.5 text-xs text-rf-muted">Estimated</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment method selection */}
                    <div className="mt-8">
                        <p className="text-sm font-bold">Payment method</p>

                        <div
                            className="mt-3 space-y-2"
                            role="radiogroup"
                            aria-label="Payment method"
                        >
                            {PAYMENT_OPTIONS.map(({ method, label, subtitle, icon }) => {
                                const isSelected = selected === method;

                                return (
                                    <button
                                        key={method}
                                        type="button"
                                        role="radio"
                                        aria-checked={isSelected}
                                        onClick={() => handleSelect(method)}
                                        className={[
                                            "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-green focus-visible:ring-offset-2",
                                            isSelected
                                                ? "border-rf-green bg-rf-green/5"
                                                : "border-rf-border hover:border-rf-green/50",
                                        ].join(" ")}
                                    >
                                        <span
                                            className={[
                                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                                isSelected
                                                    ? "bg-rf-green text-white"
                                                    : "bg-rf-surface-muted text-rf-muted",
                                            ].join(" ")}
                                            aria-hidden="true"
                                        >
                                            {icon}
                                        </span>

                                        <span className="flex-1">
                                            <span className="block text-sm font-semibold">
                                                {label}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-rf-muted">
                                                {subtitle}
                                            </span>
                                        </span>

                                        {isSelected && (
                                            <span
                                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rf-green"
                                                aria-hidden="true"
                                            >
                                                <Check size={13} className="text-white" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleContinue}
                        disabled={!selected}
                        aria-label={
                            selected
                                ? `Continue to confirm with ${selected}`
                                : "Select a payment method to continue"
                        }
                        className="mt-8 h-14 w-full rounded-2xl bg-rf-green text-sm font-semibold text-white transition hover:bg-rf-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {selected ? `Continue with ${selected}` : "Select a payment method"}
                    </button>

                </section>
            </div>
        </main>
    );
}