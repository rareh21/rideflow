"use client";

import { CheckCircle2, Clock, AlertTriangle, RefreshCw, XCircle } from "lucide-react";
import type { Refund, RefundStatus } from "@/lib/payments";

interface RefundStatusCardProps {
    refund: Refund | null;
    cancellationReason?: string | null;
    cancellationNote?: string | null;
    cancelledAt?: string | null;
    paymentMethod?: string | null;
    loading?: boolean;
}

const REASON_LABELS: Record<string, string> = {
    DRIVER_TAKING_TOO_LONG: "Driver took too long",
    CHANGE_OF_PLANS: "Change of plans",
    WRONG_PICKUP_LOCATION: "Incorrect pickup location",
    FOUND_ALTERNATIVE: "Found alternative transport",
    PRICE_TOO_HIGH: "Price unacceptable",
    ACCIDENTAL_REQUEST: "Booked by mistake",
    DRIVER_UNAVAILABLE: "No driver was available in time",
    OTHER: "Other reason",
};

const STATUS_BADGES: Record<
    RefundStatus,
    { label: string; icon: typeof CheckCircle2; className: string; description: string }
> = {
    SUCCEEDED: {
        label: "Refund Completed",
        icon: CheckCircle2,
        className: "bg-[var(--rf-green)]/15 text-[var(--rf-green-dark)] border-[var(--rf-green)]/40",
        description: "Funds have been returned to your original payment method.",
    },
    PROCESSING: {
        label: "Refund Processing",
        icon: RefreshCw,
        className: "bg-blue-50 text-blue-700 border-blue-200",
        description: "Your refund is being processed by the payment provider.",
    },
    PENDING: {
        label: "Refund Pending",
        icon: Clock,
        className: "bg-amber-50 text-amber-700 border-amber-200",
        description: "Your refund has been scheduled and will process shortly.",
    },
    FAILED: {
        label: "Refund Issue",
        icon: AlertTriangle,
        className: "bg-red-50 text-red-700 border-red-200",
        description: "Unable to complete automatic refund. Please contact support.",
    },
};

export function RefundStatusCard({
    refund,
    cancellationReason,
    cancellationNote,
    cancelledAt,
    paymentMethod,
    loading = false,
}: RefundStatusCardProps) {
    const formattedCancelledDate = cancelledAt
        ? new Date(cancelledAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        })
        : null;

    const formattedCompletedDate = refund?.completedAt
        ? new Date(refund.completedAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        })
        : null;

    const reasonLabel = cancellationReason
        ? REASON_LABELS[cancellationReason] ?? cancellationReason
        : "Ride cancelled";

    if (loading) {
        return (
            <div className="rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 animate-pulse">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="mt-3 h-8 w-48 rounded bg-gray-200" />
            </div>
        );
    }

    return (
        <section className="rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-red-50 text-[var(--rf-danger)] border border-red-100">
                        <XCircle size={14} />
                        Cancelled
                    </span>

                    <h2 className="mt-2 text-xl font-bold text-[var(--rf-midnight)]">
                        {reasonLabel}
                    </h2>

                    {formattedCancelledDate && (
                        <p className="mt-1 text-xs text-[var(--rf-muted)]">
                            Cancelled on {formattedCancelledDate}
                        </p>
                    )}
                </div>

                {refund && (
                    <div className="text-left sm:text-right">
                        <p className="text-xs font-semibold text-[var(--rf-muted)] uppercase tracking-wider">
                            Refund amount
                        </p>
                        <p className="mt-1 text-2xl font-black text-[var(--rf-midnight)]">
                            ₹{Number(refund.amount).toFixed(2)}
                        </p>
                    </div>
                )}
            </div>

            {cancellationNote && (
                <div className="mt-4 rounded-2xl bg-[var(--rf-surface-muted)] p-3 text-xs text-[var(--rf-muted)]">
                    <span className="font-semibold text-[var(--rf-midnight)]">Note: </span>
                    {cancellationNote}
                </div>
            )}

            {/* Refund Details */}
            {refund ? (
                <div className="mt-5 border-t border-[var(--rf-border)] pt-5">
                    {(() => {
                        const statusBadge = STATUS_BADGES[refund.status] ?? STATUS_BADGES.PENDING;
                        const Icon = statusBadge.icon;
                        return (
                            <div className="flex items-start gap-3 rounded-2xl border p-4 transition bg-[var(--rf-surface)] shadow-2xs">
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${statusBadge.className}`}>
                                    <Icon size={18} className={refund.status === "PROCESSING" ? "animate-spin" : ""} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-[var(--rf-midnight)]">
                                            {statusBadge.label}
                                        </p>
                                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${statusBadge.className}`}>
                                            {refund.status}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-[var(--rf-muted)]">
                                        {statusBadge.description}
                                    </p>
                                    {formattedCompletedDate && (
                                        <p className="mt-1 text-[11px] text-[var(--rf-green-dark)] font-medium">
                                            Completed: {formattedCompletedDate}
                                        </p>
                                    )}
                                    {refund.failureReason && (
                                        <p className="mt-1 text-xs text-[var(--rf-danger)] font-medium">
                                            Reason: {refund.failureReason}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            ) : (
                <div className="mt-5 border-t border-[var(--rf-border)] pt-4 text-xs text-[var(--rf-muted)]">
                    <p className="font-semibold text-[var(--rf-midnight)]">No charges incurred</p>
                    <p className="mt-0.5">This trip was cancelled while searching for a driver. No payment transaction was processed.</p>
                </div>
            )}
        </section>
    );
}
