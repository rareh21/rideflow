"use client";

import {
    Car,
    CircleDollarSign,
    LogOut,
    Radio,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { Can } from "@/authorization/Can";
import { Permissions } from "@/authorization/permissions";
import { useAuthorization } from "@/components/auth/authorization-context";

import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileError } from "@/components/profile/ProfileError";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { LogoutDialog } from "@/components/profile/LogoutDialog";
import { ProfileNavigation } from "@/components/profile/ProfileNavigation";

import { useAuth } from "@/context/auth-context";

import {
    getUserProfile,
    UserProfile,
} from "@/lib/users";

import {
    getMyDriver,
} from "@/lib/drivers";

import type {
    DriverProfile,
} from "@/lib/drivers";

export default function ProfilePage() {
    const router = useRouter();

    const { logout } = useAuth();

    const { hasPermission } =
        useAuthorization();

    const canViewDriverProfile =
        hasPermission(
            Permissions.DRIVER_PROFILE_VIEW,
        );

    const [profile, setProfile] =
        useState<UserProfile | null>(null);

    const [driver, setDriver] =
        useState<DriverProfile | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [driverLoading, setDriverLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [driverError, setDriverError] =
        useState("");

    const [logoutOpen, setLogoutOpen] =
        useState(false);

    const [loggingOut, setLoggingOut] =
        useState(false);

    const loadProfile = useCallback(
        async () => {
            try {
                setLoading(true);
                setError("");

                const data =
                    await getUserProfile();

                setProfile(data);

                /*
                 * Driver-specific information is a capability.
                 *
                 * We do not inspect the user's role here.
                 * The centralized authorization system decides
                 * whether this feature is available.
                 */
                if (canViewDriverProfile) {
                    setDriverLoading(true);
                    setDriverError("");

                    try {
                        const driverData =
                            await getMyDriver();

                        setDriver(driverData);
                    } catch (err) {
                        setDriverError(
                            err instanceof Error
                                ? err.message
                                : "Unable to load driver information.",
                        );
                    } finally {
                        setDriverLoading(false);
                    }
                } else {
                    setDriver(null);
                    setDriverLoading(false);
                    setDriverError("");
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load your profile.",
                );
            } finally {
                setLoading(false);
            }
        },
        [canViewDriverProfile],
    );

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

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
            <div className="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">

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

                        <Can
                            permission={
                                Permissions.DRIVER_PROFILE_VIEW
                            }
                        >
                            <DriverInformation
                                driver={driver}
                                loading={driverLoading}
                                error={driverError}
                                onRetry={loadProfile}
                            />
                        </Can>

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

function DriverInformation({
    driver,
    loading,
    error,
    onRetry,
}: {
    driver: DriverProfile | null;
    loading: boolean;
    error: string;
    onRetry: () => void;
}) {
    if (loading) {
        return (
            <section className="mt-6 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 shadow-sm sm:p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-5 w-40 rounded bg-[var(--rf-border)]" />

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="h-20 rounded-2xl bg-[var(--rf-border)]" />
                        <div className="h-20 rounded-2xl bg-[var(--rf-border)]" />
                        <div className="h-20 rounded-2xl bg-[var(--rf-border)]" />
                        <div className="h-20 rounded-2xl bg-[var(--rf-border)]" />
                    </div>
                </div>
            </section>
        );
    }

    if (error || !driver) {
        return (
            <section className="mt-6 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 shadow-sm sm:p-6">
                <h2 className="font-semibold text-[var(--rf-midnight)]">
                    Driver information
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--rf-muted)]">
                    {error ||
                        "Driver information is currently unavailable."}
                </p>

                <button
                    type="button"
                    onClick={onRetry}
                    className="
                        mt-4 text-sm font-semibold
                        text-[var(--rf-green-dark)]
                        hover:underline
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-[var(--rf-green)]
                    "
                >
                    Try again
                </button>
            </section>
        );
    }

    const statusLabel =
        driver.status === "AVAILABLE"
            ? "Online"
            : driver.status === "BUSY"
                ? "On a ride"
                : "Offline";

    return (
        <section className="mt-6 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                    <Car size={20} />
                </div>

                <div>
                    <h2 className="font-semibold text-[var(--rf-midnight)]">
                        Driver information
                    </h2>

                    <p className="text-xs text-[var(--rf-muted)]">
                        Your driver account
                    </p>
                </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">

                <DriverInfoCard
                    icon={<Radio size={17} />}
                    label="Availability"
                    value={statusLabel}
                />

                <DriverInfoCard
                    icon={<Car size={17} />}
                    label="Vehicle"
                    value={
                        driver.vehicle
                            ? `${driver.vehicle.make} ${driver.vehicle.model}`
                            : "Not added"
                    }
                />

                <DriverInfoCard
                    label="License number"
                    value={
                        driver.licenseNumber ||
                        "Not available"
                    }
                />

                <DriverInfoCard
                    icon={
                        <CircleDollarSign size={17} />
                    }
                    label="Earnings"
                    value="Coming soon"
                />
            </div>

            <Link
                href="/driver/availability"
                className="
                    mt-5 flex min-h-12
                    items-center justify-center
                    rounded-2xl
                    border border-[var(--rf-border)]
                    px-4
                    text-sm font-semibold
                    text-[var(--rf-midnight)]
                    transition
                    hover:border-[var(--rf-green)]
                    hover:bg-[var(--rf-surface-muted)]
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[var(--rf-green)]
                "
            >
                Manage availability
            </Link>
        </section>
    );
}

function DriverInfoCard({
    icon,
    label,
    value,
}: {
    icon?: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl bg-[var(--rf-surface-muted)] p-4">
            <div className="flex items-center gap-2">
                {icon && (
                    <span className="text-[var(--rf-green-dark)]">
                        {icon}
                    </span>
                )}

                <p className="text-xs font-medium text-[var(--rf-muted)]">
                    {label}
                </p>
            </div>

            <p className="mt-2 truncate text-sm font-semibold text-[var(--rf-midnight)]">
                {value}
            </p>
        </div>
    );
}