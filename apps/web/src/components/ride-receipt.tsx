"use client";

import { AlertCircle, CheckCircle2, Clock, Loader2, MapPin, RefreshCw } from "lucide-react";
import type { PaymentMethod, RideLocation, RideType } from "@/lib/rides";
import type { Payment } from "@/lib/payments";

export type RideReceiptProps = {
    rideId: string;
    rideType: RideType;
    pickupLocation: RideLocation;
    destinationLocation: RideLocation;
    distanceKm: number | string;
    durationMinutes: number;
    fare: number | string;
    paymentMethod?: PaymentMethod | null;
    payment?: Payment | null;
    completedAt?: string | Date | null;
    onRetryPayment?: () => void;
    isProcessingPayment?: boolean;
    actions?: React.ReactNode;
};

export function RideReceipt({
    rideType,
    pickupLocation,
    destinationLocation,
    distanceKm,
    durationMinutes,
    fare,
    paymentMethod = "UPI",
    payment,
    completedAt,
    onRetryPayment,
    isProcessingPayment = false,
    actions,
}: RideReceiptProps) {
    const formattedFare = typeof fare === "number" ? fare.toFixed(0) : fare;
    const formattedDistance = typeof distanceKm === "number" ? distanceKm.toFixed(1) : distanceKm;

    const currentStatus = payment?.status ?? "PENDING";
    const currentMethod = payment?.method ?? paymentMethod ?? "UPI";

    return (
        <div className="w-full rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 shadow-sm sm:p-8">
            {/* Header: Ride Completed Badge */}
            <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                    <CheckCircle2 size={30} />
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[var(--rf-midnight)]">
                        Ride Completed
                    </h2>
                    <span className="rounded-md bg-[var(--rf-green)]/15 px-2 py-0.5 text-xs font-bold text-[var(--rf-green-dark)]">
                        {rideType === "GO" ? "GO" : rideType}
                    </span>
                </div>

                {/* Server Fare Display */}
                <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">
                        Total Amount
                    </p>
                    <p className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--rf-midnight)]">
                        ₹{formattedFare}
                    </p>
                </div>
            </div>

            {/* Payment Transaction Status Banner */}
            <div className="mt-6">
                {currentStatus === "SUCCEEDED" && (
                    <div className="flex items-center justify-between rounded-2xl border border-[var(--rf-green)]/30 bg-[var(--rf-green)]/10 p-4 text-sm font-semibold text-[var(--rf-green-dark)]">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 size={18} className="shrink-0" />
                            <div>
                                <p className="font-bold">Payment successful</p>
                                <p className="text-xs font-normal opacity-90">
                                    ₹{formattedFare} paid via {currentMethod}
                                    {payment?.provider === "mock" && " (Dev/Mock)"}
                                </p>
                            </div>
                        </div>
                        <span className="rounded-lg bg-[var(--rf-green)]/20 px-2.5 py-1 text-xs font-bold">
                            Paid
                        </span>
                    </div>
                )}

                {currentStatus === "PROCESSING" && (
                    <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800">
                        <div className="flex items-center gap-2.5">
                            <Loader2 size={18} className="animate-spin shrink-0 text-blue-600" />
                            <div>
                                <p className="font-bold">Processing payment...</p>
                                <p className="text-xs font-normal text-blue-600">
                                    Please wait while your transaction completes.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {currentStatus === "FAILED" && (
                    <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <div className="flex items-start gap-2.5">
                            <AlertCircle size={18} className="mt-0.5 text-[var(--rf-danger)] shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-red-900">Payment failed</p>
                                <p className="mt-0.5 text-xs text-red-700">
                                    {payment?.failureReason ?? "We couldn't complete your payment. Please try again."}
                                </p>
                            </div>
                        </div>
                        {onRetryPayment && (
                            <button
                                type="button"
                                disabled={isProcessingPayment}
                                onClick={onRetryPayment}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                                {isProcessingPayment ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <RefreshCw size={14} />
                                )}
                                Try Again
                            </button>
                        )}
                    </div>
                )}

                {currentStatus === "PENDING" && (
                    <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                        <div className="flex items-center gap-2.5">
                            <Clock size={18} className="shrink-0 text-amber-600" />
                            <div>
                                <p className="font-bold">Payment Pending</p>
                                <p className="text-xs font-normal text-amber-700">
                                    {onRetryPayment
                                        ? currentMethod === "CASH"
                                            ? "Pay cash directly to your driver upon arrival."
                                            : `Pay ₹${formattedFare} via ${currentMethod}.`
                                        : currentMethod === "CASH"
                                            ? `Collect ₹${formattedFare} cash from rider upon arrival.`
                                            : `Awaiting rider payment of ₹${formattedFare} via ${currentMethod}.`}
                                </p>
                            </div>
                        </div>
                        {currentMethod !== "CASH" && onRetryPayment && (
                            <button
                                type="button"
                                disabled={isProcessingPayment}
                                onClick={onRetryPayment}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--rf-midnight)] px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                            >
                                {isProcessingPayment ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    "Pay Now"
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Pickup & Destination */}
            <div className="mt-6 space-y-3 rounded-2xl bg-[var(--rf-surface-muted)] p-5">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                        <MapPin size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[var(--rf-muted)]">Pickup</p>
                        <p className="mt-0.5 text-sm font-bold text-[var(--rf-midnight)] truncate">
                            {pickupLocation.label}
                        </p>
                    </div>
                </div>

                <div className="ml-4 h-4 border-l border-dashed border-[var(--rf-border)]" />

                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--rf-midnight)] text-white">
                        <MapPin size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[var(--rf-muted)]">Destination</p>
                        <p className="mt-0.5 text-sm font-bold text-[var(--rf-midnight)] truncate">
                            {destinationLocation.label}
                        </p>
                    </div>
                </div>
            </div>

            {/* Key Metrics: Distance, Duration, Payment */}
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-3">
                    <p className="text-xs text-[var(--rf-muted)]">Distance</p>
                    <p className="mt-1 text-sm font-bold text-[var(--rf-midnight)]">
                        {formattedDistance} km
                    </p>
                </div>

                <div className="rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-3">
                    <p className="text-xs text-[var(--rf-muted)]">Duration</p>
                    <p className="mt-1 text-sm font-bold text-[var(--rf-midnight)]">
                        {durationMinutes} min
                    </p>
                </div>

                <div className="rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-3">
                    <p className="text-xs text-[var(--rf-muted)]">Method</p>
                    <p className="mt-1 text-sm font-bold text-[var(--rf-midnight)]">
                        {currentMethod}
                    </p>
                </div>
            </div>

            {/* Timestamp Footer */}
            {completedAt && (
                <div className="mt-5 text-center text-xs text-[var(--rf-muted)]">
                    Completed on {formatCompletedDate(completedAt)}
                </div>
            )}

            {/* Optional Actions */}
            {actions && <div className="mt-6 border-t border-[var(--rf-border)] pt-5">{actions}</div>}
        </div>
    );
}

function formatCompletedDate(value: string | Date) {
    try {
        return new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    } catch {
        return String(value);
    }
}
