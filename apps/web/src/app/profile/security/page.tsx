"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Eye,
    EyeOff,
    KeyRound,
    ShieldCheck,
} from "lucide-react";
import { useState } from "react";

import { changePassword } from "@/lib/users";

export default function SecurityPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError(null);
        setSuccess(false);

        if (newPassword.length < 8) {
            setError("New password must contain at least 8 characters.");
            return;
        }

        try {
            setSaving(true);

            await changePassword({
                currentPassword,
                newPassword,
            });

            setCurrentPassword("");
            setNewPassword("");
            setSuccess(true);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to change your password.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-[var(--rf-surface-muted)]">
            <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-3">
                    <Link
                        href="/profile"
                        aria-label="Back to profile"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--rf-border)] bg-[var(--rf-surface)] text-[var(--rf-text)]"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>

                    <div>
                        <h1 className="text-xl font-semibold text-[var(--rf-text)]">
                            Security
                        </h1>

                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                            Keep your RideFlow account secure
                        </p>
                    </div>
                </div>

                <section className="mb-4 rounded-2xl bg-[var(--rf-midnight)] p-5 text-white">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--rf-green)]/15 text-[var(--rf-green)]">
                            <ShieldCheck className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="font-semibold">
                                Account security
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-white/70">
                                Keep your password strong and never share it with
                                anyone.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                            <KeyRound className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="font-semibold text-[var(--rf-text)]">
                                Change password
                            </h2>

                            <p className="text-sm text-[var(--rf-muted)]">
                                Update your RideFlow account password.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--rf-danger)]"
                        >
                            {error}
                        </div>
                    )}

                    {success && (
                        <div
                            role="status"
                            className="mt-5 rounded-xl border border-[var(--rf-green)]/20 bg-[var(--rf-green)]/10 px-4 py-3 text-sm text-[var(--rf-green-dark)]"
                        >
                            Password changed successfully.
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="mt-6 space-y-4"
                    >
                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--rf-text)]">
                                Current password
                            </label>

                            <div className="relative">
                                <input
                                    type={showCurrent ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) =>
                                        setCurrentPassword(e.target.value)
                                    }
                                    required
                                    autoComplete="current-password"
                                    className="w-full rounded-xl border border-[var(--rf-border)] bg-[var(--rf-surface)] px-4 py-3 pr-12 text-sm outline-none focus:border-[var(--rf-green)]"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCurrent(!showCurrent)
                                    }
                                    aria-label={
                                        showCurrent
                                            ? "Hide current password"
                                            : "Show current password"
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--rf-muted)]"
                                >
                                    {showCurrent ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--rf-text)]">
                                New password
                            </label>

                            <div className="relative">
                                <input
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    className="w-full rounded-xl border border-[var(--rf-border)] bg-[var(--rf-surface)] px-4 py-3 pr-12 text-sm outline-none focus:border-[var(--rf-green)]"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    aria-label={
                                        showNew
                                            ? "Hide new password"
                                            : "Show new password"
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--rf-muted)]"
                                >
                                    {showNew ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>

                            <p className="mt-2 text-xs text-[var(--rf-muted)]">
                                Use at least 8 characters.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={
                                saving ||
                                !currentPassword ||
                                !newPassword
                            }
                            className="w-full rounded-xl bg-[var(--rf-green)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--rf-green-dark)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? "Updating password..." : "Update password"}
                        </button>
                    </form>
                </section>
            </div>
        </main>
    );
}