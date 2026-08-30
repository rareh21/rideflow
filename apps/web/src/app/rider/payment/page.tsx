"use client";

import { useRouter } from "next/navigation";

import { useBooking } from "@/context/booking-context";

export default function PaymentPage() {
    const router = useRouter();

    const {
        destination,
        selectedRide,
        setStep,
    } = useBooking();

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

    function continueToPayment() {
        setStep("confirm");
        router.push("/rider/confirm");
    }

    return (
        <main className="min-h-screen bg-rf-surface-muted px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-2xl">

                <button
                    type="button"
                    onClick={() =>
                        router.push("/rider/ride-options")
                    }
                    className="text-sm font-semibold text-rf-text-secondary hover:text-rf-green"
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

                    <p className="mt-2 text-sm text-rf-text-secondary">
                        Simple, transparent payment.
                    </p>

                    {/* Selected ride */}
                    <div className="mt-8 rounded-2xl bg-rf-surface-muted p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold">
                                    {selectedRide.name}
                                </p>

                                <p className="mt-1 text-xs text-rf-text-secondary">
                                    To {destination.label}
                                </p>
                            </div>

                            <p className="text-lg font-bold">
                                ₹{selectedRide.fare}
                            </p>
                        </div>
                    </div>

                    {/* Payment methods */}
                    <div className="mt-8">
                        <p className="text-sm font-bold">
                            Payment method
                        </p>

                        <div className="mt-3 space-y-2">

                            <button
                                type="button"
                                className="flex w-full items-center justify-between rounded-2xl border border-rf-green bg-rf-green/5 p-4 text-left"
                            >
                                <span>
                                    <span className="block text-sm font-semibold">
                                        UPI
                                    </span>

                                    <span className="mt-1 block text-xs text-rf-text-secondary">
                                        ****@upi
                                    </span>
                                </span>

                                <span className="text-rf-green">
                                    ✓
                                </span>
                            </button>

                            <button
                                type="button"
                                className="flex w-full items-center justify-between rounded-2xl border border-rf-border p-4 text-left transition hover:border-rf-green"
                            >
                                <span>
                                    <span className="block text-sm font-semibold">
                                        Visa
                                    </span>

                                    <span className="mt-1 block text-xs text-rf-text-secondary">
                                        •••• 4242
                                    </span>
                                </span>
                            </button>

                            <button
                                type="button"
                                className="flex w-full items-center justify-between rounded-2xl border border-rf-border p-4 text-left transition hover:border-rf-green"
                            >
                                <span className="text-sm font-semibold">
                                    Cash
                                </span>
                            </button>

                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={continueToPayment}
                        className="mt-8 h-14 w-full rounded-2xl bg-rf-green text-sm font-semibold text-white transition hover:bg-rf-green-dark"
                    >
                        Continue
                    </button>

                </section>
            </div>
        </main>
    );
}