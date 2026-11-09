"use client";

import { useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Heart,
    Loader2,
    MapPin,
    RefreshCw,
    Sparkles,
} from "lucide-react";
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
    onAddTip?: (tipAmount: number) => Promise<void>;
    isProcessingPayment?: boolean;
    actions?: React.ReactNode;
};

const PRESET_TIPS = [20, 50, 100];

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
    onAddTip,
    isProcessingPayment = false,
    actions,
}: RideReceiptProps) {
    const [selectedTip, setSelectedTip] = useState<number | null>(null);
    const [isCustomTip, setIsCustomTip] = useState(false);
    const [customTipValue, setCustomTipValue] = useState("");
    const [isSubmittingTip, setIsSubmittingTip] = useState(false);
    const [tipError, setTipError] = useState<string | null>(null);
    const [tipSuccess, setTipSuccess] = useState<string | null>(null);

    const baseFareNumber = typeof fare === "number" ? fare : Number(fare) || 0;
    const formattedFare = baseFareNumber.toFixed(0);
    const formattedDistance =
        typeof distanceKm === "number" ? distanceKm.toFixed(1) : distanceKm;

    const currentStatus = payment?.status ?? "PENDING";
    const currentMethod = payment?.method ?? paymentMethod ?? "UPI";
    const currentTip = Number(payment?.tipAmount ?? 0);
    const totalAmount = currentTip > 0 ? (baseFareNumber + currentTip).toFixed(0) : formattedFare;

    const handleSelectPreset = (amount: number) => {
        setIsCustomTip(false);
        setTipError(null);
        setSelectedTip(selectedTip === amount ? null : amount);
    };

    const handleSelectCustom = () => {
        setIsCustomTip(true);
        setSelectedTip(null);
        setTipError(null);
    };

    const handleTipSubmit = async () => {
        if (!onAddTip) return;

        const tipToSubmit = isCustomTip ? Number(customTipValue) : selectedTip;
        if (!tipToSubmit || tipToSubmit <= 0) {
            setTipError("Please enter or select a valid tip amount.");
            return;
        }

        try {
            setIsSubmittingTip(true);
            setTipError(null);
            await onAddTip(tipToSubmit);
            setTipSuccess(`Added ₹${tipToSubmit} tip to your driver!`);
            setSelectedTip(null);
            setIsCustomTip(false);
            setCustomTipValue("");
        } catch (err) {
            setTipError(err instanceof Error ? err.message : "Failed to add tip. Please try again.");
        } finally {
            setIsSubmittingTip(false);
        }
    };

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
                        Total Amount Paid
                    </p>
                    <p className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--rf-midnight)]">
                        ₹{totalAmount}
                    </p>
                    {currentTip > 0 && (
                        <p className="mt-1 text-xs text-[var(--rf-muted)]">
                            Includes ₹{formattedFare} base fare + ₹{currentTip} driver tip
                        </p>
                    )}
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
                                    ₹{totalAmount} paid via {currentMethod}
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

            {/* In-App Tipping Module (Rider View) */}
            {onAddTip && currentStatus === "SUCCEEDED" && (
                <div className="mt-6 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-5">
                    <div className="flex items-center gap-2 text-amber-900">
                        <Heart size={18} className="fill-amber-500 text-amber-500" />
                        <h3 className="text-sm font-bold">Add a Tip for Your Driver</h3>
                    </div>
                    <p className="mt-1 text-xs text-amber-800/80">
                        100% of your tip goes directly to your driver. Thank them for a great trip!
                    </p>

                    {/* Active Tip or Preset Chips */}
                    {currentTip > 0 ? (
                        <div className="mt-4 flex items-center justify-between rounded-xl bg-white/80 p-3.5 border border-amber-200 text-sm font-semibold text-amber-900">
                            <span className="flex items-center gap-2">
                                <Sparkles size={16} className="text-amber-500" />
                                Tip Added: ₹{currentTip}
                            </span>
                            <span className="text-xs text-amber-700 font-normal">
                                Thank you for your support!
                            </span>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-4 gap-2">
                                {PRESET_TIPS.map((amount) => (
                                    <button
                                        key={amount}
                                        type="button"
                                        disabled={isSubmittingTip}
                                        onClick={() => handleSelectPreset(amount)}
                                        className={`rounded-xl py-2.5 text-xs font-bold transition ${
                                            selectedTip === amount && !isCustomTip
                                                ? "bg-amber-600 text-white shadow-sm"
                                                : "bg-white text-gray-800 border border-amber-200 hover:border-amber-400"
                                        }`}
                                    >
                                        ₹{amount}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    disabled={isSubmittingTip}
                                    onClick={handleSelectCustom}
                                    className={`rounded-xl py-2.5 text-xs font-bold transition ${
                                        isCustomTip
                                            ? "bg-amber-600 text-white shadow-sm"
                                            : "bg-white text-gray-800 border border-amber-200 hover:border-amber-400"
                                    }`}
                                >
                                    Custom
                                </button>
                            </div>

                            {/* Custom Tip Input */}
                            {isCustomTip && (
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-sm font-bold text-gray-600">₹</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5000"
                                        placeholder="Enter tip amount"
                                        value={customTipValue}
                                        onChange={(e) => setCustomTipValue(e.target.value)}
                                        className="h-10 flex-1 rounded-xl border border-amber-300 bg-white px-3 text-sm font-bold text-gray-900 placeholder:font-normal focus:border-amber-600 focus:outline-none"
                                    />
                                </div>
                            )}

                            {tipError && (
                                <p className="text-xs font-semibold text-red-600">{tipError}</p>
                            )}

                            {tipSuccess && (
                                <p className="text-xs font-semibold text-green-700">{tipSuccess}</p>
                            )}

                            {(selectedTip !== null || (isCustomTip && customTipValue)) && (
                                <button
                                    type="button"
                                    disabled={isSubmittingTip}
                                    onClick={handleTipSubmit}
                                    className="flex w-full min-h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 text-xs font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"
                                >
                                    {isSubmittingTip ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Heart size={14} className="fill-white" />
                                    )}
                                    Send ₹{isCustomTip ? customTipValue || 0 : selectedTip} Tip
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Driver Tip Notification (Driver View) */}
            {!onAddTip && currentTip > 0 && (
                <div className="mt-6 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm font-semibold text-amber-900">
                    <div className="flex items-center gap-2.5">
                        <Sparkles size={18} className="text-amber-600" />
                        <div>
                            <p className="font-bold">Rider Tip Received</p>
                            <p className="text-xs font-normal text-amber-700">
                                You earned a ₹{currentTip} bonus tip from the rider on this trip!
                            </p>
                        </div>
                    </div>
                    <span className="rounded-lg bg-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-900">
                        +₹{currentTip}
                    </span>
                </div>
            )}

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

            {/* Key Metrics: Distance, Duration, Method */}
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
