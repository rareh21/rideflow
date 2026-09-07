'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Car, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getMyDriver } from '@/lib/drivers';
import type { DriverProfile } from '@/lib/drivers';

export default function DriverProfilePage() {
    const router = useRouter();

    const [driver, setDriver] =
        useState<DriverProfile | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getMyDriver()
            .then(setDriver)
            .catch((err) => {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to load driver profile',
                );
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <main className="min-h-screen bg-[var(--rf-surface-muted)] p-6">
                <div className="mx-auto max-w-3xl animate-pulse">
                    <div className="h-8 w-48 rounded bg-[var(--rf-border)]" />
                    <div className="mt-6 h-80 rounded-2xl bg-[var(--rf-surface)]" />
                </div>
            </main>
        );
    }

    if (error || !driver) {
        return (
            <main className="min-h-screen bg-[var(--rf-surface-muted)] p-6">
                <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6">
                    <h1 className="text-xl font-semibold">
                        Unable to load profile
                    </h1>

                    <p className="mt-2 text-sm text-[var(--rf-muted)]">
                        {error ?? 'Driver profile not found.'}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[var(--rf-surface-muted)] p-4 sm:p-6">
            <div className="mx-auto max-w-3xl">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/driver')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Driver Dashboard
                </Button>

                <div className="mt-4 rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--rf-green)]/10">
                            <ShieldCheck className="h-7 w-7 text-[var(--rf-green-dark)]" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-[var(--rf-midnight)]">
                                {driver.user.name}
                            </h1>

                            <p className="text-sm text-[var(--rf-muted)]">
                                Driver · {driver.status}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-5 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--rf-muted)]">
                                Email
                            </p>
                            <p className="mt-1 text-sm font-medium">
                                {driver.user.email}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--rf-muted)]">
                                License number
                            </p>
                            <p className="mt-1 text-sm font-medium">
                                {driver.licenseNumber ?? 'Not provided'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-[var(--rf-border)] pt-6">
                        <div className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-[var(--rf-green)]" />

                            <h2 className="font-semibold text-[var(--rf-midnight)]">
                                Vehicle
                            </h2>
                        </div>

                        {driver.vehicle ? (
                            <div className="mt-4 rounded-xl bg-[var(--rf-surface-muted)] p-4">
                                <p className="font-medium">
                                    {driver.vehicle.make}{' '}
                                    {driver.vehicle.model}
                                </p>

                                <p className="mt-1 text-sm text-[var(--rf-muted)]">
                                    {driver.vehicle.year} ·{' '}
                                    {driver.vehicle.plateNumber}
                                </p>
                            </div>
                        ) : (
                            <div className="mt-4 rounded-xl border border-dashed border-[var(--rf-border)] p-5">
                                <p className="text-sm text-[var(--rf-muted)]">
                                    No vehicle has been registered yet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}