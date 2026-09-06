"use client";

import { useEffect, useState } from "react";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { SettingRow } from "@/components/profile/SettingRow";
import { Toggle } from "@/components/ui/toggle";

import {
    getUserPreferences,
    updateUserPreferences,
    UserPreferences,
} from "@/lib/users";

export default function PreferencesPage() {
    const [preferences, setPreferences] =
        useState<UserPreferences | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError("");

                const data = await getUserPreferences();

                setPreferences(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load notification settings."
                );
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    async function updatePreference(
        key:
            | "rideNotificationsEnabled"
            | "promotionalNotificationsEnabled",
        value: boolean
    ) {
        if (!preferences || saving) return;

        const previous = preferences;

        setPreferences({
            ...preferences,
            [key]: value,
        });

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const updated = await updateUserPreferences({
                [key]: value,
            });

            setPreferences(updated);
            setSuccess("Notification preferences updated.");
        } catch (err) {
            setPreferences(previous);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update notification preferences."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6">
                <ProfileHeader
                    title="Notifications"
                    backHref="/profile"
                />

                {loading ? (
                    <div className="animate-pulse">
                        <div className="h-44 rounded-3xl bg-[var(--rf-surface)]" />
                    </div>
                ) : preferences ? (
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
                  bg-[var(--rf-surface)]
                  p-4 text-sm
                  font-medium
                  text-[var(--rf-green-dark)]
                "
                            >
                                {success}
                            </div>
                        )}

                        <ProfileSection title="Notifications">
                            <SettingRow
                                title="Ride updates"
                                description="Get updates about bookings, drivers and ride status."
                            >
                                <Toggle
                                    checked={preferences.rideNotificationsEnabled}
                                    disabled={saving}
                                    label="Ride update notifications"
                                    onChange={(value) =>
                                        updatePreference(
                                            "rideNotificationsEnabled",
                                            value
                                        )
                                    }
                                />
                            </SettingRow>

                            <div className="mx-4 border-t border-[var(--rf-border)]" />

                            <SettingRow
                                title="Offers & promotions"
                                description="Receive occasional RideFlow offers and promotions."
                            >
                                <Toggle
                                    checked={
                                        preferences.promotionalNotificationsEnabled
                                    }
                                    disabled={saving}
                                    label="Promotional notifications"
                                    onChange={(value) =>
                                        updatePreference(
                                            "promotionalNotificationsEnabled",
                                            value
                                        )
                                    }
                                />
                            </SettingRow>
                        </ProfileSection>

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
                ) : null}
            </div>
        </main>
    );
}