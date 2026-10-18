"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CancellationReason } from "@/lib/rides";

interface CancellationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: CancellationReason, note?: string) => Promise<void>;
    isCancelling?: boolean;
    error?: string | null;
}

const REASONS: Array<{ value: CancellationReason; label: string; description: string }> = [
    {
        value: "DRIVER_TAKING_TOO_LONG",
        label: "Driver is taking too long",
        description: "Estimated wait time is longer than expected.",
    },
    {
        value: "CHANGE_OF_PLANS",
        label: "Change of plans",
        description: "You no longer need to travel right now.",
    },
    {
        value: "WRONG_PICKUP_LOCATION",
        label: "Wrong pickup location",
        description: "Need to re-enter the pickup address.",
    },
    {
        value: "FOUND_ALTERNATIVE",
        label: "Found alternative ride",
        description: "Another transport option became available.",
    },
    {
        value: "PRICE_TOO_HIGH",
        label: "Price is too high",
        description: "Decided not to proceed at current estimated fare.",
    },
    {
        value: "ACCIDENTAL_REQUEST",
        label: "Booked by mistake",
        description: "The ride request was submitted accidentally.",
    },
    {
        value: "OTHER",
        label: "Other reason",
        description: "Something else occurred.",
    },
];

export function CancellationDialog({
    isOpen,
    onClose,
    onConfirm,
    isCancelling = false,
    error = null,
}: CancellationDialogProps) {
    const [selectedReason, setSelectedReason] = useState<CancellationReason>("CHANGE_OF_PLANS");
    const [note, setNote] = useState("");

    // Close on Escape key
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && !isCancelling && isOpen) {
                onClose();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isCancelling, onClose]);

    if (!isOpen) {
        return null;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        await onConfirm(selectedReason, note.trim() || undefined);
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-dialog-title"
        >
            <div className="relative w-full max-w-lg rounded-3xl bg-[var(--rf-surface)] p-6 sm:p-8 shadow-2xl border border-[var(--rf-border)] max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isCancelling}
                    aria-label="Close dialog"
                    className="absolute top-6 right-6 rounded-full p-2 text-[var(--rf-muted)] hover:bg-gray-100 hover:text-[var(--rf-midnight)] transition disabled:opacity-50"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-[var(--rf-danger)] shrink-0">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h2 id="cancel-dialog-title" className="text-xl font-bold text-[var(--rf-midnight)]">
                            Cancel Ride
                        </h2>
                        <p className="text-xs text-[var(--rf-muted)]">
                            Please select a reason for cancelling this trip.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--rf-danger)]" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <fieldset className="space-y-2">
                        <legend className="text-xs font-bold uppercase tracking-wider text-[var(--rf-muted)] mb-2">
                            Reason for cancellation
                        </legend>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {REASONS.map((r) => {
                                const isChecked = selectedReason === r.value;
                                return (
                                    <label
                                        key={r.value}
                                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${
                                            isChecked
                                                ? "border-[var(--rf-green-dark)] bg-[var(--rf-green)]/10"
                                                : "border-[var(--rf-border)] bg-[var(--rf-surface)] hover:bg-gray-50"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="cancellationReason"
                                            value={r.value}
                                            checked={isChecked}
                                            onChange={() => setSelectedReason(r.value)}
                                            disabled={isCancelling}
                                            className="mt-1 h-4 w-4 text-[var(--rf-green-dark)] focus:ring-[var(--rf-green)]"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-[var(--rf-midnight)]">
                                                {r.label}
                                            </p>
                                            <p className="text-xs text-[var(--rf-muted)]">
                                                {r.description}
                                            </p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* Optional Note */}
                    <div>
                        <label htmlFor="cancel-note" className="block text-xs font-semibold text-[var(--rf-muted)] mb-1">
                            Additional notes (optional)
                        </label>
                        <textarea
                            id="cancel-note"
                            rows={2}
                            maxLength={500}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            disabled={isCancelling}
                            placeholder="Add details (optional)..."
                            className="w-full rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-3 text-sm text-[var(--rf-midnight)] placeholder:text-gray-400 focus:border-[var(--rf-green)] focus:outline-none"
                        />
                    </div>

                    {/* No Charge Notice */}
                    <div className="flex items-start gap-3 rounded-2xl bg-[var(--rf-surface-muted)] border border-[var(--rf-border)] p-3.5 text-xs text-[var(--rf-midnight)]">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[var(--rf-green-dark)]" />
                        <div>
                            <p className="font-semibold">No cancellation fee</p>
                            <p className="text-[var(--rf-muted)] text-[11px] mt-0.5">
                                You have not been charged for this ride. No payment transaction was processed.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isCancelling}
                            className="min-h-11"
                        >
                            Keep Ride
                        </Button>
                        <Button
                            type="submit"
                            variant="danger"
                            disabled={isCancelling}
                            className="min-h-11"
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                "Confirm Cancellation"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
