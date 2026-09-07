"use client";

import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Clock3,
    FileCheck2,
    RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    getDriverApplication,
} from "@/lib/drivers";

import type {
    DriverApplication,
} from "@/lib/drivers";

export default function DriverApplicationPage() {
    const router = useRouter();

    const [application, setApplication] =
        useState<DriverApplication | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadApplication() {
            try {
                setLoading(true);
                setError(null);

                const response =
                    await getDriverApplication();

                if (active) {
                    setApplication(response);
                }
            } catch (err) {
                if (!active) {
                    return;
                }

                const message =
                    err instanceof Error
                        ? err.message
                        : "Unable to check your driver application.";

                /*
                 * A missing application is an expected empty state.
                 */
                if (
                    message
                        .toLowerCase()
                        .includes("not found")
                ) {
                    setApplication(null);
                    return;
                }

                setError(message);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadApplication();

        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                    <div className="animate-pulse space-y-6">
                        <div className="h-4 w-28 rounded bg-[var(--rf-border)]" />

                        <div className="h-10 w-72 rounded-lg bg-[var(--rf-border)]" />

                        <div className="h-72 rounded-3xl bg-[var(--rf-border)]" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                    <button
                        type="button"
                        onClick={() =>
                            router.push("/rider")
                        }
                        className="
                            inline-flex items-center gap-2
                            text-sm font-semibold
                            text-[var(--rf-muted)]
                            transition
                            hover:text-[var(--rf-green-dark)]
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-[var(--rf-green)]
                            focus-visible:ring-offset-2
                        "
                    >
                        <ArrowLeft size={16} />
                        Back to RideFlow
                    </button>

                    <section className="mt-6 rounded-3xl border border-red-200 bg-[var(--rf-surface)] p-6 shadow-sm sm:p-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                            <AlertCircle
                                size={23}
                                className="text-[var(--rf-danger)]"
                            />
                        </div>

                        <h1 className="mt-5 text-xl font-bold text-[var(--rf-midnight)]">
                            Unable to load your application
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-[var(--rf-muted)]">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                window.location.reload()
                            }
                            className="
                                mt-6 inline-flex min-h-12
                                items-center justify-center gap-2
                                rounded-2xl
                                bg-[var(--rf-green)]
                                px-5
                                text-sm font-semibold
                                text-[var(--rf-midnight)]
                                transition
                                hover:bg-[var(--rf-green-dark)]
                                focus-visible:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-[var(--rf-green)]
                            "
                        >
                            <RotateCcw size={17} />
                            Try again
                        </button>
                    </section>
                </div>
            </div>
        );
    }

    /*
     * No application submitted yet.
     */
    if (!application) {
        return (
            <div className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                    <button
                        type="button"
                        onClick={() =>
                            router.push("/rider")
                        }
                        className="
                            inline-flex items-center gap-2
                            text-sm font-semibold
                            text-[var(--rf-muted)]
                            transition
                            hover:text-[var(--rf-green-dark)]
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-[var(--rf-green)]
                            focus-visible:ring-offset-2
                        "
                    >
                        <ArrowLeft size={16} />
                        Back to RideFlow
                    </button>

                    <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] shadow-sm">
                        <div className="bg-[var(--rf-midnight)] p-6 text-white sm:p-8">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--rf-green)] text-[var(--rf-midnight)]">
                                <FileCheck2 size={23} />
                            </div>

                            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[var(--rf-green)]">
                                RideFlow Driver
                            </p>

                            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                                Become a RideFlow driver
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-white/65">
                                Drive with RideFlow and turn your
                                time on the road into an opportunity.
                            </p>
                        </div>

                        <div className="p-6 sm:p-8">
                            <div className="space-y-4">
                                <InfoRow
                                    icon={
                                        <FileCheck2 size={18} />
                                    }
                                    text="Submit your driver details"
                                />

                                <InfoRow
                                    icon={
                                        <Clock3 size={18} />
                                    }
                                    text="We'll review your application"
                                />

                                <InfoRow
                                    icon={
                                        <CheckCircle2 size={18} />
                                    }
                                    text="Get approved and start onboarding"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/rider/driver-application/apply",
                                    )
                                }
                                className="
                                    mt-8 flex min-h-14 w-full
                                    items-center justify-center
                                    rounded-2xl
                                    bg-[var(--rf-green)]
                                    px-5
                                    text-sm font-semibold
                                    text-[var(--rf-midnight)]
                                    transition
                                    hover:bg-[var(--rf-green-dark)]
                                    focus-visible:outline-none
                                    focus-visible:ring-2
                                    focus-visible:ring-[var(--rf-green)]
                                "
                            >
                                Start driver application
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    const isPending =
        application.status === "PENDING";

    const isApproved =
        application.status === "APPROVED";

    const isRejected =
        application.status === "REJECTED";

    return (
        <div className="min-h-full bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">

                <button
                    type="button"
                    onClick={() =>
                        router.push("/rider")
                    }
                    className="
                        inline-flex items-center gap-2
                        text-sm font-semibold
                        text-[var(--rf-muted)]
                        transition
                        hover:text-[var(--rf-green-dark)]
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-[var(--rf-green)]
                        focus-visible:ring-offset-2
                    "
                >
                    <ArrowLeft size={16} />
                    Back to RideFlow
                </button>

                <section className="mt-6 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 shadow-sm sm:p-8">

                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-green-dark)]">
                        RideFlow Driver
                    </p>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--rf-midnight)] sm:text-3xl">
                        Your driver application
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-[var(--rf-muted)]">
                        Track the current status of your driver
                        application.
                    </p>

                    {/* Status */}
                    <div className="mt-7 rounded-2xl bg-[var(--rf-surface-muted)] p-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-muted)]">
                            Application status
                        </p>

                        <div className="mt-3 flex items-center gap-3">
                            <StatusIcon
                                status={application.status}
                            />

                            <div>
                                <p className="text-lg font-bold text-[var(--rf-midnight)]">
                                    {isPending
                                        ? "Under review"
                                        : isApproved
                                            ? "Approved"
                                            : "Rejected"}
                                </p>

                                <p className="text-xs text-[var(--rf-muted)]">
                                    {application.status}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pending */}
                    {isPending && (
                        <div className="mt-6">
                            <h2 className="text-lg font-bold text-[var(--rf-midnight)]">
                                We're reviewing your application
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-[var(--rf-muted)]">
                                Your application has been submitted
                                successfully. We'll review your details
                                before activating your driver account.
                            </p>

                            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                <Clock3
                                    size={18}
                                    className="mt-0.5 shrink-0 text-amber-600"
                                />

                                <p className="text-sm leading-5 text-amber-800">
                                    No action is required from you
                                    right now.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Approved */}
                    {isApproved && (
                        <div className="mt-6">
                            <h2 className="text-lg font-bold text-[var(--rf-midnight)]">
                                You're approved
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-[var(--rf-muted)]">
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
                                className="
                                    mt-6 flex min-h-14 w-full
                                    items-center justify-center
                                    rounded-2xl
                                    bg-[var(--rf-green)]
                                    px-5
                                    text-sm font-semibold
                                    text-[var(--rf-midnight)]
                                    transition
                                    hover:bg-[var(--rf-green-dark)]
                                    focus-visible:outline-none
                                    focus-visible:ring-2
                                    focus-visible:ring-[var(--rf-green)]
                                "
                            >
                                Continue onboarding
                            </button>
                        </div>
                    )}

                    {/* Rejected */}
                    {isRejected && (
                        <div className="mt-6">
                            <h2 className="text-lg font-bold text-[var(--rf-midnight)]">
                                Application needs attention
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-[var(--rf-muted)]">
                                Your application wasn't approved this
                                time. Review the reason below and submit
                                your application again.
                            </p>

                            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-red-700">
                                    Review feedback
                                </p>

                                <p className="mt-2 text-sm leading-6 text-red-800">
                                    {application.rejectionReason ??
                                        "Your application was not approved."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/rider/driver-application/apply",
                                    )
                                }
                                className="
                                    mt-6 flex min-h-14 w-full
                                    items-center justify-center gap-2
                                    rounded-2xl
                                    bg-[var(--rf-green)]
                                    px-5
                                    text-sm font-semibold
                                    text-[var(--rf-midnight)]
                                    transition
                                    hover:bg-[var(--rf-green-dark)]
                                    focus-visible:outline-none
                                    focus-visible:ring-2
                                    focus-visible:ring-[var(--rf-green)]
                                "
                            >
                                <RotateCcw size={18} />
                                Review and reapply
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

function StatusIcon({
    status,
}: {
    status: DriverApplication["status"];
}) {
    if (status === "APPROVED") {
        return (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--rf-green)]/10">
                <CheckCircle2
                    size={22}
                    className="text-[var(--rf-green-dark)]"
                />
            </div>
        );
    }

    if (status === "REJECTED") {
        return (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                <AlertCircle
                    size={22}
                    className="text-[var(--rf-danger)]"
                />
            </div>
        );
    }

    return (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
            <Clock3
                size={22}
                className="text-amber-600"
            />
        </div>
    );
}

function InfoRow({
    icon,
    text,
}: {
    icon: React.ReactNode;
    text: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                {icon}
            </div>

            <p className="text-sm font-medium text-[var(--rf-midnight)]">
                {text}
            </p>
        </div>
    );
}