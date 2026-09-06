"use client";

import {
    Bell,
    CreditCard,
    HelpCircle,
    Lock,
    LogOut,
    MapPin,
    Shield,
    UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileError } from "@/components/profile/ProfileError";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileMenuItem } from "@/components/profile/ProfileMenuItem";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { LogoutDialog } from "@/components/profile/LogoutDialog";
import { useAuth } from "@/context/auth-context";
import { getUserProfile, UserProfile } from "@/lib/users";

export default function ProfilePage() {
    const { logout } = useAuth();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

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
        } finally {
            setLoggingOut(false);
            setLogoutOpen(false);
        }
    }

    if (loading) {
        return <ProfileSkeleton />;
    }

    return (
        <main className="min-h-screen bg-[var(--rf-surface-muted)]">
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
                            <ProfileSection title="Personal">
                                <ProfileMenuItem
                                    href="/profile/edit"
                                    icon={UserRound}
                                    title="Personal information"
                                    description="Manage your name and account details"
                                />

                                <ProfileMenuItem
                                    href="/profile/saved-places"
                                    icon={MapPin}
                                    title="Saved places"
                                    description="Home, work and favorite locations"
                                />
                            </ProfileSection>

                            <ProfileSection title="Payments">
                                <ProfileMenuItem
                                    href="/profile/payment-settings"
                                    icon={CreditCard}
                                    title="Payment settings"
                                    description="Manage your preferred payment method"
                                />
                            </ProfileSection>

                            <ProfileSection title="Preferences">
                                <ProfileMenuItem
                                    href="/profile/preferences"
                                    icon={Bell}
                                    title="Notifications"
                                    description="Manage your RideFlow notifications"
                                />

                                <ProfileMenuItem
                                    href="/profile/privacy"
                                    icon={Shield}
                                    title="Privacy"
                                    description="Manage privacy preferences"
                                />

                                <ProfileMenuItem
                                    href="/profile/security"
                                    icon={Lock}
                                    title="Security"
                                    description="Manage account security"
                                />
                            </ProfileSection>

                            <ProfileSection title="Support">
                                <ProfileMenuItem
                                    href="/profile/help-support"
                                    icon={HelpCircle}
                                    title="Help & support"
                                    description="Get help with RideFlow"
                                />
                            </ProfileSection>

                            <button
                                type="button"
                                onClick={() => setLogoutOpen(true)}
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
                onCancel={() => setLogoutOpen(false)}
                onConfirm={handleLogout}
            />
        </main>
    );
}