"use client";

import {
    Car,
    CircleDollarSign,
    MapPin,
    UserRound,
    ChevronRight,
    Radio,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    getMyDriver,
    updateDriverStatus,
} from "@/lib/drivers";

import type {
    DriverProfile,
    DriverStatus,
} from "@/lib/drivers";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DriverDashboardPage() {
    const router = useRouter();

    const [driver, setDriver] =
        useState<DriverProfile | null>(null);

    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] =
        useState(false);
    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadDriver() {
            try {
                setLoading(true);
                setError(null);

                const data = await getMyDriver();

                if (active) {
                    setDriver(data);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load driver profile",
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadDriver();

        return () => {
            active = false;
        };
    }, []);

    async function handleStatusChange(
        status: DriverStatus,
    ) {
        if (!driver || updatingStatus) {
            return;
        }

        try {
            setUpdatingStatus(true);
            setError(null);

            const updated =
                await updateDriverStatus(status);

            setDriver(updated);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update driver status",
            );
        } finally {
            setUpdatingStatus(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-4 w-32 rounded bg-[var(--rf-border)]" />
                        <div className="h-9 w-72 rounded-lg bg-[var(--rf-border)]" />

                        <div className="h-48 rounded-3xl bg-[var(--rf-border)]" />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="h-36 rounded-2xl bg-[var(--rf-border)]" />
                            <div className="h-36 rounded-2xl bg-[var(--rf-border)]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !driver) {
        return (
            <div className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-2xl px-4 py-10 pb-28 sm:px-6">
                    <div className="rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                            <Car
                                size={22}
                                className="text-[var(--rf-danger)]"
                            />
                        </div>

                        <h1 className="mt-5 text-xl font-semibold text-[var(--rf-midnight)]">
                            Driver dashboard unavailable
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-[var(--rf-muted)]">
                            {error ??
                                "Driver profile not found."}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    router.push("/profile")
                                }
                            >
                                Back to Profile
                            </Button>

                            <Button
                                variant="primary"
                                onClick={() =>
                                    window.location.reload()
                                }
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isOnline =
        driver.status === "AVAILABLE";

    const statusLabel =
        driver.status === "AVAILABLE"
            ? "Online"
            : driver.status === "BUSY"
                ? "On a ride"
                : "Offline";

    const statusDescription =
        driver.status === "AVAILABLE"
            ? "You're available to receive ride requests."
            : driver.status === "BUSY"
                ? "You're currently handling a ride."
                : "Go online when you're ready to accept rides.";

    return (
        <div className="min-h-full bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">

                {/* Page heading */}
                <header>
                    <p className="text-sm font-semibold text-[var(--rf-green-dark)]">
                        Driver Console
                    </p>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--rf-midnight)] sm:text-3xl">
                        Good to see you, {driver.user.name}
                    </h1>

                    <p className="mt-2 text-sm text-[var(--rf-muted)]">
                        Manage your availability, rides and driver account.
                    </p>
                </header>

                {/* Error feedback */}
                {error && (
                    <div
                        role="alert"
                        className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--rf-danger)]"
                    >
                        {error}
                    </div>
                )}

                {/* Main status card */}
                <section className="mt-6 overflow-hidden rounded-3xl bg-[var(--rf-midnight)] p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

                        <div>
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--rf-green)] text-[var(--rf-midnight)]">
                                    <Radio size={23} />
                                </div>

                                <div>
                                    <p className="text-sm text-white/60">
                                        Current availability
                                    </p>

                                    <div className="mt-1 flex items-center gap-2">
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${isOnline
                                                ? "bg-[var(--rf-green)]"
                                                : "bg-white/40"
                                                }`}
                                        />

                                        <h2 className="text-xl font-semibold text-white">
                                            {statusLabel}
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-5 max-w-xl text-sm leading-6 text-white/65">
                                {statusDescription}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                            {driver.status === "OFFLINE" && (
                                <Button
                                    variant="primary"
                                    disabled={updatingStatus}
                                    onClick={() =>
                                        handleStatusChange(
                                            "AVAILABLE",
                                        )
                                    }
                                >
                                    {updatingStatus
                                        ? "Going online..."
                                        : "Go Online"}
                                </Button>
                            )}

                            {driver.status === "AVAILABLE" && (
                                <Button
                                    variant="secondary"
                                    disabled={updatingStatus}
                                    onClick={() =>
                                        handleStatusChange(
                                            "OFFLINE",
                                        )
                                    }
                                >
                                    {updatingStatus
                                        ? "Going offline..."
                                        : "Go Offline"}
                                </Button>
                            )}

                            {driver.status === "BUSY" && (
                                <div className="rounded-xl bg-white/10 px-4 py-3 text-center text-sm text-white/70">
                                    Ride in progress
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Dashboard cards */}
                <section className="mt-6 grid gap-4 md:grid-cols-3">

                    <DashboardCard
                        icon={
                            <CircleDollarSign size={21} />
                        }
                        title="Today's earnings"
                        value="₹0"
                        description="Earnings will appear after completed rides."
                    />

                    <DashboardCard
                        icon={<MapPin size={21} />}
                        title="Today's rides"
                        value="0"
                        description="Completed rides today."
                    />

                    <DashboardCard
                        icon={<Car size={21} />}
                        title="Vehicle"
                        value={
                            driver.vehicle
                                ? `${driver.vehicle.make} ${driver.vehicle.model}`
                                : "Not added"
                        }
                        description={
                            driver.vehicle
                                ? driver.vehicle.plateNumber
                                : "Add your vehicle to start driving."
                        }
                        href="/driver/vehicle"
                    />
                </section>

                {/* Quick actions */}
                <section className="mt-6 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 shadow-sm sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-[var(--rf-midnight)]">
                                Quick actions
                            </h2>

                            <p className="mt-1 text-sm text-[var(--rf-muted)]">
                                Manage your driver account.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <QuickAction
                            icon={<Radio size={19} />}
                            title="Availability"
                            description="Manage online status"
                            href="/driver/availability"
                        />

                        <QuickAction
                            icon={<UserRound size={19} />}
                            title="Profile"
                            description="Manage your account"
                            href="/profile"
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}

function DashboardCard({
    icon,
    title,
    value,
    description,
    href,
}: {
    icon: React.ReactNode;
    title: string;
    value: string;
    description: string;
    href?: string;
}) {
    const content = (
        <div className="rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 shadow-sm transition">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                    {icon}
                </div>

                <p className="text-sm font-medium text-[var(--rf-muted)]">
                    {title}
                </p>
            </div>

            <p className="mt-5 truncate text-xl font-bold text-[var(--rf-midnight)]">
                {value}
            </p>

            <p className="mt-1 text-xs leading-5 text-[var(--rf-muted)]">
                {description}
            </p>
        </div>
    );

    if (!href) {
        return content;
    }

    return (
        <Link
            href={href}
            className="block transition hover:-translate-y-0.5"
        >
            {content}
        </Link>
    );
}

function QuickAction({
    icon,
    title,
    description,
    href,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="
                group flex items-center justify-between
                rounded-2xl
                border border-[var(--rf-border)]
                bg-[var(--rf-surface)]
                p-4
                transition
                hover:border-[var(--rf-green)]
                hover:bg-[var(--rf-surface-muted)]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[var(--rf-green)]
            "
        >
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                    {icon}
                </div>

                <div>
                    <p className="text-sm font-semibold text-[var(--rf-midnight)]">
                        {title}
                    </p>

                    <p className="mt-0.5 text-xs text-[var(--rf-muted)]">
                        {description}
                    </p>
                </div>
            </div>

            <ChevronRight
                size={18}
                className="
                    text-[var(--rf-muted)]
                    transition
                    group-hover:translate-x-0.5
                "
            />
        </Link>
    );
}

function routerPush(href: string) {
    window.location.href = href;
}