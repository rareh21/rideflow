"use client";

import { AlertCircle, ArrowLeft, CreditCard, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getMyPayments, type Payment, type PaymentStatus } from "@/lib/payments";

const STATUS_CONFIG: Record<
    PaymentStatus,
    { label: string; icon: typeof CheckCircle2; className: string }
> = {
    SUCCEEDED: {
        label: "Paid",
        icon: CheckCircle2,
        className: "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)] border-[var(--rf-green)]/30",
    },
    PENDING: {
        label: "Pending",
        icon: Clock,
        className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    PROCESSING: {
        label: "Processing",
        icon: Loader2,
        className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    FAILED: {
        label: "Failed",
        icon: XCircle,
        className: "bg-red-50 text-red-700 border-red-200",
    },
    CANCELLED: {
        label: "Cancelled",
        icon: XCircle,
        className: "bg-gray-100 text-gray-700 border-gray-200",
    },
};

export default function RiderPaymentHistoryPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function loadPayments() {
        try {
            setLoading(true);
            setError(null);
            const data = await getMyPayments();
            setPayments(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to load payment history.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadPayments();
    }, []);

    return (
        <main className="min-h-full bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--rf-muted)] hover:text-[var(--rf-green-dark)]"
                >
                    <ArrowLeft size={16} />
                    Profile
                </Link>

                <header className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-green-dark)]">
                        Rider
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--rf-midnight)] sm:text-3xl">
                        Payment History
                    </h1>
                    <p className="mt-1 text-sm text-[var(--rf-muted)]">
                        View your transaction history across RideFlow trips.
                    </p>
                </header>

                {loading && (
                    <div className="mt-6 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-24 animate-pulse rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)]"
                            />
                        ))}
                    </div>
                )}

                {!loading && error && (
                    <section className="mt-6 rounded-3xl border border-red-200 bg-[var(--rf-surface)] p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={20} className="mt-0.5 text-[var(--rf-danger)] shrink-0" />
                            <div>
                                <h2 className="font-semibold text-[var(--rf-midnight)]">
                                    Unable to load payment history
                                </h2>
                                <p className="mt-1 text-sm text-[var(--rf-muted)]">{error}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => void loadPayments()}
                            className="mt-4 text-sm font-semibold text-[var(--rf-green-dark)]"
                        >
                            Try again
                        </button>
                    </section>
                )}

                {!loading && !error && payments.length === 0 && (
                    <section className="mt-6 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-8 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                            <CreditCard size={26} />
                        </div>
                        <h2 className="mt-4 text-lg font-bold text-[var(--rf-midnight)]">
                            No transactions yet
                        </h2>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--rf-muted)]">
                            When you complete rides, your payment transactions will appear here.
                        </p>
                    </section>
                )}

                {!loading && !error && payments.length > 0 && (
                    <div className="mt-6 space-y-3">
                        {payments.map((p) => {
                            const config = STATUS_CONFIG[p.status];
                            const StatusIcon = config.icon;

                            return (
                                <div
                                    key={p.id}
                                    className="flex items-center justify-between gap-4 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 shadow-sm sm:p-6"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-[var(--rf-midnight)]">
                                                Ride Payment
                                            </p>
                                            <span className="text-xs font-semibold text-[var(--rf-muted)]">
                                                · {p.method}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-[var(--rf-muted)]">
                                            {formatDate(p.createdAt)}
                                        </p>
                                        <Link
                                            href={`/rider/rides/${p.rideId}`}
                                            className="mt-2 inline-block text-xs font-semibold text-[var(--rf-green-dark)] hover:underline"
                                        >
                                            View Ride #{p.rideId.slice(0, 8)}
                                        </Link>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-extrabold text-[var(--rf-midnight)]">
                                            ₹{p.amount}
                                        </p>
                                        <span
                                            className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${config.className}`}
                                        >
                                            <StatusIcon size={12} />
                                            {config.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}

function formatDate(value: string) {
    try {
        return new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    } catch {
        return String(value);
    }
}