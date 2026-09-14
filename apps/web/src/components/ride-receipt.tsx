"use client";

import { CheckCircle2, MapPin } from "lucide-react";
import type { PaymentMethod, RideLocation, RideType } from "@/lib/rides";

export type RideReceiptProps = {
    rideId: string;
    rideType: RideType;
    pickupLocation: RideLocation;
    destinationLocation: RideLocation;
    distanceKm: number | string;
    durationMinutes: number;
    fare: number | string;
    paymentMethod?: PaymentMethod | null;
    completedAt?: string | Date | null;
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
    completedAt,
    actions,
}: RideReceiptProps) {
    const formattedFare = typeof fare === "number" ? fare.toFixed(0) : fare;
    const formattedDistance = typeof distanceKm === "number" ? distanceKm.toFixed(1) : distanceKm;

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

            {/* Pickup & Destination */}
            <div className="mt-7 space-y-3 rounded-2xl bg-[var(--rf-surface-muted)] p-5">
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
                    <p className="text-xs text-[var(--rf-muted)]">Payment</p>
                    <p className="mt-1 text-sm font-bold text-[var(--rf-midnight)]">
                        {paymentMethod ?? "UPI"}
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
