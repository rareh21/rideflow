"use client";

import { useEffect, useState } from "react";

import { PaymentMethodCard } from "@/components/profile/PaymentMethodCard";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import {
    getUserPreferences,
    updateUserPreferences,
    UserPreferences,
} from "@/lib/users";

type PaymentMethod = "UPI" | "CARD" | "CASH";

export default function PaymentSettingsPage() {
    const [preferences, setPreferences] =
        useState<UserPreferences | null>(null);

    const [selected, setSelected] =
        useState<PaymentMethod>("UPI");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function loadPreferences() {
            try {
                setLoading(true);
                setError("");

                const data = await getUserPreferences();

                setPreferences(data);
                setSelected(data.defaultPaymentMethod);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load payment settings."
                );
            } finally {
                setLoading(false);
            }
        }

        loadPreferences();
    }, []);

    async function handleSelect(method: PaymentMethod) {
        if (saving) return;

        const previous = selected;

        setSelected(method);
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const updated = await updateUserPreferences({
                defaultPaymentMethod: method,
            });

            setPreferences(updated);
            setSuccess("Payment preference updated.");
        } catch (err) {
            setSelected(previous);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update payment settings."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6">
                <ProfileHeader
                    title="Payment settings"
                    backHref="/profile"
                />

                <section
                    className="
            rounded-3xl
            border border-[var(--rf-border)]
            bg-[var(--rf-surface)]
            p-5
            shadow-[0_8px_30px_rgba(7,20,31,0.05)]
            sm:p-6
          "
                >
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-[var(--rf-text)]">
                            Preferred payment method
                        </h2>

                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                            Select the method you want to use by default.
                        </p>
                    </div>

                    {loading ? (
                        <div className="animate-pulse space-y-3">
                            <div className="h-20 rounded-2xl bg-[var(--rf-surface-muted)]" />
                            <div className="h-20 rounded-2xl bg-[var(--rf-surface-muted)]" />
                            <div className="h-20 rounded-2xl bg-[var(--rf-surface-muted)]" />
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div
                                    role="alert"
                                    className="
                    mb-4 rounded-2xl
                    border border-red-200
                    bg-red-50
                    p-4 text-sm text-red-700
                  "
                                >
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div
                                    role="status"
                                    className="
                    mb-4 rounded-2xl
                    bg-[var(--rf-surface-muted)]
                    p-4 text-sm
                    font-medium
                    text-[var(--rf-green-dark)]
                  "
                                >
                                    {success}
                                </div>
                            )}

                            <div className="space-y-3">
                                <PaymentMethodCard
                                    method="UPI"
                                    selected={selected === "UPI"}
                                    onSelect={() => handleSelect("UPI")}
                                />

                                <PaymentMethodCard
                                    method="CARD"
                                    selected={selected === "CARD"}
                                    onSelect={() => handleSelect("CARD")}
                                />

                                <PaymentMethodCard
                                    method="CASH"
                                    selected={selected === "CASH"}
                                    onSelect={() => handleSelect("CASH")}
                                />
                            </div>

                            {saving && (
                                <p
                                    role="status"
                                    className="
                    mt-4 text-center text-xs
                    text-[var(--rf-muted)]
                  "
                                >
                                    Saving...
                                </p>
                            )}
                        </>
                    )}
                </section>

                {preferences && (
                    <p className="mt-4 px-1 text-xs text-[var(--rf-muted)]">
                        This method will be selected automatically during ride booking.
                    </p>
                )}
            </div>
        </main>
    );
}