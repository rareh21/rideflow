"use client";

import {
    Check,
    CircleOff,
    Loader2,
    Radio,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
    getMyDriver,
    updateDriverStatus,
} from "@/lib/drivers";

import type {
    DriverProfile,
    DriverStatus,
} from "@/lib/drivers";

import { Button } from "@/components/ui/button";

const statusMeta: Record<
    DriverStatus,
    {
        label: string;
        description: string;
    }
> = {
    OFFLINE: {
        label: "Offline",
        description:
            "You're not currently accepting ride requests.",
    },
    AVAILABLE: {
        label: "Online",
        description:
            "You're available and can receive ride requests.",
    },
    BUSY: {
        label: "On a ride",
        description:
            "You're currently handling a ride.",
    },
};

export default function DriverAvailabilityPage() {
    const [driver, setDriver] =
        useState<DriverProfile | null>(null);

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] =
        useState<string | null>(null);
    const [success, setSuccess] =
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
                            : "Unable to load availability.",
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
        nextStatus: DriverStatus,
    ) {
        if (!driver || updating) {
            return;
        }

        if (nextStatus === driver.status) {
            return;
        }

        try {
            setUpdating(true);
            setError(null);
            setSuccess(null);

            const updated =
                await updateDriverStatus(nextStatus);

            setDriver(updated);

            setSuccess(
                `Availability updated to ${statusMeta[updated.status].label}.`,
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update availability.",
            );
        } finally {
            setUpdating(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-2xl px-4 py-6 pb-28 sm:px-6 lg:py-8 lg:pb-8">
                    <div className="animate-pulse space-y-5">
                        <div className="h-4 w-24 rounded bg-[var(--rf-border)]" />
                        <div className="h-9 w-56 rounded-lg bg-[var(--rf-border)]" />
                        <div className="h-72 rounded-3xl bg-[var(--rf-border)]" />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !driver) {
        return (
            <div className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-2xl px-4 py-10 pb-28 sm:px-6">
                    <div
                        role="alert"
                        className="rounded-3xl border border-red-200 bg-[var(--rf-surface)] p-6 shadow-sm"
                    >
                        <h1 className="text-xl font-semibold text-[var(--rf-midnight)]">
                            Availability unavailable
                        </h1>

                        <p className="mt-2 text-sm text-[var(--rf-muted)]">
                            {error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!driver) {
        return null;
    }

    const currentStatus = driver.status;
    const meta = statusMeta[currentStatus];

    return (
        <div className="min-h-full bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-2xl px-4 py-6 pb-28 sm:px-6 lg:py-8 lg:pb-8">

                <header>
                    <p className="text-sm font-semibold text-[var(--rf-green-dark)]">
                        Driver Console
                    </p>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--rf-midnight)] sm:text-3xl">
                        Availability
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-[var(--rf-muted)]">
                        Control when you're available to receive rides.
                    </p>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--rf-danger)]"
                    >
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        role="status"
                        className="mt-5 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                    >
                        <Check size={17} />
                        {success}
                    </div>
                )}

                <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] shadow-sm">

                    <div className="p-6 sm:p-8">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                                <Radio size={25} />
                            </div>

                            <div>
                                <p className="text-sm text-[var(--rf-muted)]">
                                    Current status
                                </p>

                                <h2 className="mt-1 text-2xl font-bold text-[var(--rf-midnight)]">
                                    {meta.label}
                                </h2>
                            </div>
                        </div>

                        <p className="mt-6 text-sm leading-6 text-[var(--rf-muted)]">
                            {meta.description}
                        </p>

                        {currentStatus === "BUSY" ? (
                            <div className="mt-6 rounded-2xl bg-[var(--rf-surface-muted)] p-4">
                                <div className="flex items-start gap-3">
                                    <CircleOff
                                        size={19}
                                        className="mt-0.5 text-[var(--rf-muted)]"
                                    />

                                    <div>
                                        <p className="text-sm font-semibold text-[var(--rf-midnight)]">
                                            Ride in progress
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-[var(--rf-muted)]">
                                            Your availability will become
                                            available again after the
                                            current ride is completed.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-6">
                                <Button
                                    variant={
                                        currentStatus ===
                                            "AVAILABLE"
                                            ? "secondary"
                                            : "primary"
                                    }
                                    disabled={updating}
                                    onClick={() =>
                                        handleStatusChange(
                                            currentStatus ===
                                                "AVAILABLE"
                                                ? "OFFLINE"
                                                : "AVAILABLE",
                                        )
                                    }
                                >
                                    {updating && (
                                        <Loader2
                                            size={17}
                                            className="mr-2 animate-spin"
                                        />
                                    )}

                                    {currentStatus ===
                                        "AVAILABLE"
                                        ? "Go Offline"
                                        : "Go Online"}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[var(--rf-border)] bg-[var(--rf-surface-muted)] px-6 py-5 sm:px-8">
                        <div className="flex items-start gap-3">
                            {currentStatus ===
                                "AVAILABLE" ? (
                                <Check
                                    size={18}
                                    className="mt-0.5 text-[var(--rf-green-dark)]"
                                />
                            ) : (
                                <CircleOff
                                    size={18}
                                    className="mt-0.5 text-[var(--rf-muted)]"
                                />
                            )}

                            <div>
                                <p className="text-sm font-medium text-[var(--rf-midnight)]">
                                    {currentStatus ===
                                        "AVAILABLE"
                                        ? "You're ready for rides"
                                        : currentStatus ===
                                            "BUSY"
                                            ? "You're handling a ride"
                                            : "You're currently offline"}
                                </p>

                                <p className="mt-1 text-xs leading-5 text-[var(--rf-muted)]">
                                    Driver status is synchronized with
                                    your RideFlow account.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}