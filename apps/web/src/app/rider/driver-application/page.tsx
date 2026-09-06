"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getDriverApplication } from "@/lib/drivers";
import type { DriverApplication } from "@/lib/drivers";

export default function DriverApplicationPage() {
    const router = useRouter();

    const [application, setApplication] =
        useState<DriverApplication | null>(null);

    const [loading, setLoading] = useState(true);

    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function loadApplication() {
            try {
                const response =
                    await getDriverApplication();

                setApplication(response);
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }

        void loadApplication();
    }, []);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-rf-surface-muted">
                <div className="text-center">
                    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-rf-green/20 border-t-rf-green" />

                    <p className="mt-4 text-sm text-rf-text-secondary">
                        Checking your application...
                    </p>
                </div>
            </main>
        );
    }

    if (notFound) {
        return (
            <main className="min-h-screen bg-rf-surface-muted px-4 py-8">
                <div className="mx-auto max-w-xl">

                    <button
                        type="button"
                        onClick={() => router.push("/rider")}
                        className="text-sm font-semibold text-rf-text-secondary hover:text-rf-green"
                    >
                        ← Back to RideFlow
                    </button>

                    <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">

                        <p className="text-sm font-bold text-rf-green">
                            RIDEFLOW
                        </p>

                        <h1 className="mt-3 text-3xl font-bold">
                            Become a RideFlow driver
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-rf-text-secondary">
                            Drive with RideFlow and turn your time on
                            the road into an opportunity.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                router.push(
                                    "/rider/driver-application/apply",
                                )
                            }
                            className="mt-8 h-14 w-full rounded-2xl bg-rf-green text-sm font-semibold text-white transition hover:bg-rf-green-dark"
                        >
                            Start driver application
                        </button>

                    </section>
                </div>
            </main>
        );
    }

    if (!application) {
        return null;
    }

    const isPending =
        application.status === "PENDING";

    const isApproved =
        application.status === "APPROVED";

    const isRejected =
        application.status === "REJECTED";

    return (
        <main className="min-h-screen bg-rf-surface-muted px-4 py-8">
            <div className="mx-auto max-w-xl">

                <button
                    type="button"
                    onClick={() => router.push("/rider")}
                    className="text-sm font-semibold text-rf-text-secondary hover:text-rf-green"
                >
                    ← Back to RideFlow
                </button>

                <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">

                    <p className="text-sm font-bold tracking-wide text-rf-green">
                        RIDEFLOW DRIVER
                    </p>

                    <h1 className="mt-3 text-3xl font-bold">
                        Your driver application
                    </h1>

                    <div className="mt-8 rounded-2xl bg-rf-surface-muted p-5">

                        <p className="text-xs font-bold uppercase tracking-wide text-rf-text-secondary">
                            Application status
                        </p>

                        <div className="mt-3 flex items-center gap-3">

                            <span
                                className={[
                                    "h-3 w-3 rounded-full",
                                    isPending &&
                                    "bg-yellow-500",
                                    isApproved &&
                                    "bg-rf-green",
                                    isRejected &&
                                    "bg-red-500",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                            />

                            <span className="text-lg font-bold">
                                {application.status}
                            </span>

                        </div>

                    </div>

                    {isPending && (
                        <div className="mt-5">
                            <h2 className="text-lg font-bold">
                                We're reviewing your application
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-rf-text-secondary">
                                Your application has been submitted
                                successfully. We'll review your details
                                before activating your driver account.
                            </p>
                        </div>
                    )}

                    {isApproved && (
                        <div className="mt-5">
                            <h2 className="text-lg font-bold">
                                You're approved
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-rf-text-secondary">
                                Your driver application has been
                                approved. Continue onboarding to get
                                ready for your first RideFlow trip.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/rider/driver-onboarding",
                                    )
                                }
                                className="mt-6 h-14 w-full rounded-2xl bg-rf-green text-sm font-semibold text-white"
                            >
                                Continue onboarding
                            </button>
                        </div>
                    )}

                    {isRejected && (
                        <div className="mt-5">
                            <h2 className="text-lg font-bold">
                                Application needs attention
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-rf-text-secondary">
                                {application.rejectionReason ??
                                    "Your application was not approved."}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/rider/driver-application/apply",
                                    )
                                }
                                className="mt-6 h-14 w-full rounded-2xl bg-rf-green text-sm font-semibold text-white"
                            >
                                Review and reapply
                            </button>
                        </div>
                    )}

                </section>
            </div>
        </main>
    );
}