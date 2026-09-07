'use client';

import { useEffect, useState } from 'react';
import { Car, CircleDollarSign, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { getMyDriver, updateDriverStatus } from '@/lib/drivers';
import type {
    DriverProfile,
    DriverStatus,
} from '@/lib/drivers';

import { Button } from '@/components/ui/button';

export default function DriverDashboardPage() {
    const router = useRouter();

    const [driver, setDriver] =
        useState<DriverProfile | null>(null);

    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] =
        useState(false);
    const [error, setError] = useState<string | null>(null);

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
                            : 'Unable to load driver profile',
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
        if (!driver) return;

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
                    : 'Unable to update driver status',
            );
        } finally {
            setUpdatingStatus(false);
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[var(--rf-surface-muted)] p-6">
                <div className="mx-auto max-w-6xl animate-pulse">
                    <div className="h-8 w-56 rounded bg-[var(--rf-border)]" />
                    <div className="mt-6 h-48 rounded-2xl bg-[var(--rf-surface)]" />
                </div>
            </main>
        );
    }

    if (error || !driver) {
        return (
            <main className="min-h-screen bg-[var(--rf-surface-muted)] p-6">
                <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6">
                    <h1 className="text-xl font-semibold text-[var(--rf-text)]">
                        Driver dashboard unavailable
                    </h1>

                    <p className="mt-2 text-sm text-[var(--rf-muted)]">
                        {error ?? 'Driver profile not found.'}
                    </p>

                    <div className="mt-5">
                        <Button
                            variant="secondary"
                            onClick={() => router.push('/profile')}
                        >
                            Back to Profile
                        </Button>
                    </div>
                </div>
            </main>
        );
    }

    const isOnline =
        driver.status === 'AVAILABLE';

    return (
        <main className="min-h-screen bg-[var(--rf-surface-muted)] p-4 sm:p-6">
            <div className="mx-auto max-w-6xl">
                <header>
                    <p className="text-sm font-medium text-[var(--rf-green-dark)]">
                        Driver Console
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-[var(--rf-midnight)] sm:text-3xl">
                        Good evening, {driver.user.name}
                    </h1>

                    <p className="mt-2 text-sm text-[var(--rf-muted)]">
                        Manage your availability and driver profile.
                    </p>
                </header>

                <section className="mt-6 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 lg:col-span-2">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-[var(--rf-muted)]">
                                    Driver status
                                </p>

                                <div className="mt-2 flex items-center gap-2">
                                    <span
                                        className={`h-3 w-3 rounded-full ${isOnline
                                            ? 'bg-[var(--rf-green)]'
                                            : 'bg-[var(--rf-muted)]'
                                            }`}
                                    />

                                    <span className="text-2xl font-bold text-[var(--rf-midnight)]">
                                        {driver.status}
                                    </span>
                                </div>
                            </div>

                            <Car className="h-6 w-6 text-[var(--rf-green)]" />
                        </div>

                        <div className="mt-6">
                            {driver.status === 'OFFLINE' && (
                                <Button
                                    variant="primary"
                                    disabled={updatingStatus}
                                    onClick={() =>
                                        handleStatusChange('AVAILABLE')
                                    }
                                >
                                    {updatingStatus
                                        ? 'Going online...'
                                        : 'Go Online'}
                                </Button>
                            )}

                            {driver.status === 'AVAILABLE' && (
                                <Button
                                    variant="secondary"
                                    disabled={updatingStatus}
                                    onClick={() =>
                                        handleStatusChange('OFFLINE')
                                    }
                                >
                                    {updatingStatus
                                        ? 'Going offline...'
                                        : 'Go Offline'}
                                </Button>
                            )}

                            {driver.status === 'BUSY' && (
                                <p className="text-sm text-[var(--rf-muted)]">
                                    You are currently on a ride.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6">
                        <p className="text-sm font-medium text-[var(--rf-muted)]">
                            Today's earnings
                        </p>

                        <div className="mt-4 flex items-center gap-3">
                            <CircleDollarSign className="h-6 w-6 text-[var(--rf-green)]" />

                            <span className="text-2xl font-bold text-[var(--rf-midnight)]">
                                ₹0
                            </span>
                        </div>

                        <p className="mt-2 text-xs text-[var(--rf-muted)]">
                            Earnings will appear after completed rides.
                        </p>
                    </div>
                </section>

                <section className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6">
                        <MapPin className="h-5 w-5 text-[var(--rf-green)]" />

                        <h2 className="mt-4 font-semibold text-[var(--rf-midnight)]">
                            Today's rides
                        </h2>

                        <p className="mt-2 text-3xl font-bold text-[var(--rf-text)]">
                            0
                        </p>

                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                            Completed rides today
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6">
                        <Car className="h-5 w-5 text-[var(--rf-green)]" />

                        <h2 className="mt-4 font-semibold text-[var(--rf-midnight)]">
                            Vehicle
                        </h2>

                        {driver.vehicle ? (
                            <>
                                <p className="mt-2 font-medium text-[var(--rf-text)]">
                                    {driver.vehicle.make}{' '}
                                    {driver.vehicle.model}
                                </p>

                                <p className="mt-1 text-sm text-[var(--rf-muted)]">
                                    {driver.vehicle.plateNumber}
                                </p>
                            </>
                        ) : (
                            <p className="mt-2 text-sm text-[var(--rf-muted)]">
                                No vehicle added yet.
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}