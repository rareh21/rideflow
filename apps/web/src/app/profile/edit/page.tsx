"use client";

import { FormEvent, useEffect, useState } from "react";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import {
    getUserProfile,
    updateUserProfile,
    UserProfile,
} from "@/lib/users";

export default function EditProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadProfile() {
        try {
            setLoading(true);
            setError("");

            const data = await getUserProfile();

            setProfile(data);
            setName(data.name);
            setEmail(data.email);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load your profile."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProfile();
    }, []);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        const trimmedName = name.trim();
        const trimmedEmail = email.trim();

        if (!trimmedName) {
            setError("Please enter your name.");
            return;
        }

        if (!trimmedEmail) {
            setError("Please enter your email address.");
            return;
        }

        try {
            setSaving(true);

            const updated = await updateUserProfile({
                name: trimmedName,
                email: trimmedEmail,
            });

            setProfile(updated);
            setName(updated.name);
            setEmail(updated.email);

            setSuccess("Your profile has been updated.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update your profile."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6">
                <ProfileHeader
                    title="Personal information"
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
                    {loading ? (
                        <div className="animate-pulse space-y-5">
                            <div className="h-14 rounded-2xl bg-[var(--rf-surface-muted)]" />
                            <div className="h-14 rounded-2xl bg-[var(--rf-surface-muted)]" />
                            <div className="h-14 rounded-2xl bg-[var(--rf-surface-muted)]" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div
                                    role="alert"
                                    className="
                    rounded-2xl
                    border border-red-200
                    bg-red-50
                    p-4
                    text-sm text-red-700
                  "
                                >
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div
                                    role="status"
                                    className="
                    rounded-2xl
                    bg-[var(--rf-surface-muted)]
                    p-4
                    text-sm font-medium
                    text-[var(--rf-green-dark)]
                  "
                                >
                                    {success}
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="name"
                                    className="
                    mb-2 block
                    text-sm font-semibold
                    text-[var(--rf-text)]
                  "
                                >
                                    Full name
                                </label>

                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    disabled={saving}
                                    autoComplete="name"
                                    className="
                    w-full
                    rounded-2xl
                    border border-[var(--rf-border)]
                    bg-[var(--rf-surface)]
                    px-4 py-3.5
                    text-sm text-[var(--rf-text)]
                    outline-none
                    transition
                    placeholder:text-[var(--rf-muted)]
                    focus:border-[var(--rf-green)]
                    focus:ring-4
                    focus:ring-[var(--rf-green)]/10
                    disabled:opacity-60
                  "
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="
                    mb-2 block
                    text-sm font-semibold
                    text-[var(--rf-text)]
                  "
                                >
                                    Email address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    disabled={saving}
                                    autoComplete="email"
                                    className="
                    w-full
                    rounded-2xl
                    border border-[var(--rf-border)]
                    bg-[var(--rf-surface)]
                    px-4 py-3.5
                    text-sm text-[var(--rf-text)]
                    outline-none
                    transition
                    focus:border-[var(--rf-green)]
                    focus:ring-4
                    focus:ring-[var(--rf-green)]/10
                    disabled:opacity-60
                  "
                                />
                            </div>

                            {profile && (
                                <div
                                    className="
                    rounded-2xl
                    bg-[var(--rf-surface-muted)]
                    p-4
                  "
                                >
                                    <p className="text-xs text-[var(--rf-muted)]">
                                        Account type
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-[var(--rf-text)]">
                                        {profile.role}
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="
                  w-full
                  rounded-2xl
                  bg-[var(--rf-green)]
                  px-5 py-3.5
                  text-sm font-bold
                  text-[var(--rf-midnight)]
                  shadow-[0_8px_20px_rgba(22,199,106,0.20)]
                  transition
                  hover:bg-[var(--rf-green-dark)]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
                            >
                                {saving ? "Saving changes..." : "Save changes"}
                            </button>
                        </form>
                    )}
                </section>
            </div>
        </main>
    );
}