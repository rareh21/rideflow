"use client";

import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileError } from "@/components/profile/ProfileError";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { LogoutDialog } from "@/components/profile/LogoutDialog";
import { ProfileNavigation } from "@/components/profile/ProfileNavigation";

import { useAuth } from "@/context/auth-context";
import { getUserProfile, UserProfile } from "@/lib/users";

export default function ProfilePage() {
    const router = useRouter();
    const { logout } = useAuth();

    const [profile, setProfile] =
        useState<UserProfile | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [logoutOpen, setLogoutOpen] =
        useState(false);

    const [loggingOut, setLoggingOut] =
        useState(false);

    async function loadProfile() {
        try {
            setLoading(true);
            setError("");

            const data = await getUserProfile();
            setProfile(data);
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

    async function handleLogout() {
        try {
            setLoggingOut(true);

            await logout();

            router.replace("/login");
        } finally {
            setLoggingOut(false);
            setLogoutOpen(false);
        }
    }

    if (loading) {
        return <ProfileSkeleton />;
    }

    return (
        <div className="min-h-full bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6">
                <ProfileHeader
                    title="Profile"
                    editHref="/profile/edit"
                />

                {error ? (
                    <ProfileError
                        message={error}
                        onRetry={loadProfile}
                    />
                ) : profile ? (
                    <>
                        <ProfileCard
                            name={profile.name}
                            email={profile.email}
                            role={profile.role}
                            createdAt={profile.createdAt}
                        />

                        <div className="mt-8 space-y-6">
                            <ProfileNavigation />

                            <button
                                type="button"
                                onClick={() =>
                                    setLogoutOpen(true)
                                }
                                className="
                                    flex w-full
                                    items-center justify-center gap-2
                                    rounded-2xl
                                    border border-red-200
                                    bg-[var(--rf-surface)]
                                    px-4 py-4
                                    text-sm font-semibold
                                    text-[var(--rf-danger)]
                                    transition
                                    hover:bg-red-50
                                    focus-visible:outline-none
                                    focus-visible:ring-2
                                    focus-visible:ring-red-500
                                "
                            >
                                <LogOut size={18} />
                                Sign out
                            </button>
                        </div>
                    </>
                ) : null}
            </div>

            <LogoutDialog
                open={logoutOpen}
                loading={loggingOut}
                onCancel={() =>
                    setLogoutOpen(false)
                }
                onConfirm={handleLogout}
            />
        </div>
    );
}