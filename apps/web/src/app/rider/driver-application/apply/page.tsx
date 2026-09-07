"use client";

import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    FileCheck2,
    Loader2,
    ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    createDriverApplication,
    getDriverApplication,
} from "@/lib/drivers";

import type {
    DriverApplication,
} from "@/lib/drivers";

export default function DriverApplicationApplyPage() {
    const router = useRouter();

    const [application, setApplication] =
        useState<DriverApplication | null>(null);

    const [licenseNumber, setLicenseNumber] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [success, setSuccess] =
        useState(false);

    useEffect(() => {
        let active = true;

        async function loadApplication() {
            try {
                setLoading(true);
                setError(null);

                const response =
                    await getDriverApplication();

                if (!active) {
                    return;
                }

                setApplication(response);

                if (response.licenseNumber) {
                    setLicenseNumber(
                        response.licenseNumber,
                    );
                }
            } catch (err) {
                if (!active) {
                    return;
                }

                const message =
                    err instanceof Error
                        ? err.message
                        : "Unable to load your driver application.";

                /*
                 * No existing application is a valid
                 * state for this page.
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

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const normalizedLicenseNumber =
            licenseNumber.trim();

        if (!normalizedLicenseNumber) {
            setError(
                "Please enter your driving licence number.",
            );
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            setSuccess(false);

            await createDriverApplication({
                licenseNumber:
                    normalizedLicenseNumber,
            });

            setSuccess(true);

            /*
             * Keep the user on the application flow and
             * allow the status page to fetch the latest
             * server state.
             */
            router.replace(
                "/rider/driver-application",
            );
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Unable to submit your driver application.";

            setError(message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                    <div className="animate-pulse space-y-6">
                        <div className="h-4 w-28 rounded bg-[var(--rf-border)]" />

                        <div className="h-10 w-72 rounded-lg bg-[var(--rf-border)]" />

                        <div className="h-96 rounded-3xl bg-[var(--rf-border)]" />
                    </div>
                </div>
            </div>
        );
    }

    /*
     * Existing pending application cannot be submitted
     * again because the API protects duplicate applications.
     */
    if (
        application?.status === "PENDING" ||
        application?.status === "APPROVED"
    ) {
        return (
            <div className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                    <Link
                        href="/rider/driver-application"
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
                        Back to application
                    </Link>

                    <section className="mt-6 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 shadow-sm sm:p-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--rf-green)]/10">
                            <CheckCircle2
                                size={23}
                                className="text-[var(--rf-green-dark)]"
                            />
                        </div>

                        <h1 className="mt-5 text-2xl font-bold tracking-tight text-[var(--rf-midnight)]">
                            {application.status ===
                                "PENDING"
                                ? "Application already submitted"
                                : "Application already approved"}
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-[var(--rf-muted)]">
                            {application.status ===
                                "PENDING"
                                ? "Your application is currently under review. You don't need to submit it again."
                                : "Your driver application has already been approved. Continue with onboarding to activate your driver account."}
                        </p>

                        <Link
                            href={
                                application.status ===
                                    "APPROVED"
                                    ? "/rider/driver-onboarding"
                                    : "/rider/driver-application"
                            }
                            className="
                                mt-7 flex min-h-14 w-full
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
                            {application.status ===
                                "APPROVED"
                                ? "Continue onboarding"
                                : "View application status"}
                        </Link>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                <Link
                    href="/rider/driver-application"
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
                    Back to application
                </Link>

                <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] shadow-sm">
                    {/* Hero */}
                    <div className="bg-[var(--rf-midnight)] p-6 text-white sm:p-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--rf-green)] text-[var(--rf-midnight)]">
                            <FileCheck2 size={23} />
                        </div>

                        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[var(--rf-green)]">
                            RideFlow Driver
                        </p>

                        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                            {application?.status ===
                                "REJECTED"
                                ? "Update your application"
                                : "Become a RideFlow driver"}
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-white/65">
                            {application?.status ===
                                "REJECTED"
                                ? "Update your details and submit your application again for review."
                                : "Complete your driver details to start your RideFlow driver application."}
                        </p>
                    </div>

                    <div className="p-6 sm:p-8">
                        {/* Rejection feedback */}
                        {application?.status ===
                            "REJECTED" && (
                                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle
                                            size={19}
                                            className="mt-0.5 shrink-0 text-[var(--rf-danger)]"
                                        />

                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-red-700">
                                                Previous review feedback
                                            </p>

                                            <p className="mt-2 text-sm leading-6 text-red-800">
                                                {application.rejectionReason ??
                                                    "Your previous application was not approved."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* Information */}
                        <div className="rounded-2xl bg-[var(--rf-surface-muted)] p-4">
                            <div className="flex items-start gap-3">
                                <ShieldCheck
                                    size={20}
                                    className="mt-0.5 shrink-0 text-[var(--rf-green-dark)]"
                                />

                                <div>
                                    <p className="text-sm font-semibold text-[var(--rf-midnight)]">
                                        Your information is secure
                                    </p>

                                    <p className="mt-1 text-sm leading-5 text-[var(--rf-muted)]">
                                        Your licence information
                                        will be used to review
                                        your eligibility to drive
                                        with RideFlow.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="mt-7"
                        >
                            <div>
                                <label
                                    htmlFor="licenseNumber"
                                    className="block text-sm font-semibold text-[var(--rf-midnight)]"
                                >
                                    Driving licence number
                                </label>

                                <p className="mt-1 text-xs leading-5 text-[var(--rf-muted)]">
                                    Enter the licence number
                                    exactly as shown on your
                                    driving licence.
                                </p>

                                <input
                                    id="licenseNumber"
                                    name="licenseNumber"
                                    type="text"
                                    value={licenseNumber}
                                    onChange={(event) =>
                                        setLicenseNumber(
                                            event.target
                                                .value,
                                        )
                                    }
                                    placeholder="Enter licence number"
                                    autoComplete="off"
                                    disabled={submitting}
                                    required
                                    className="
                                        mt-3 min-h-12 w-full
                                        rounded-2xl
                                        border border-[var(--rf-border)]
                                        bg-[var(--rf-surface)]
                                        px-4
                                        text-sm
                                        font-medium
                                        text-[var(--rf-midnight)]
                                        outline-none
                                        transition
                                        placeholder:text-[var(--rf-muted)]
                                        focus:border-[var(--rf-green)]
                                        focus:ring-2
                                        focus:ring-[var(--rf-green)]/20
                                        disabled:cursor-not-allowed
                                        disabled:opacity-60
                                    "
                                />
                            </div>

                            {error && (
                                <div
                                    role="alert"
                                    className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <AlertCircle
                                            size={18}
                                            className="mt-0.5 shrink-0 text-[var(--rf-danger)]"
                                        />

                                        <p className="text-sm leading-5 text-red-800">
                                            {error}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {success && (
                                <div
                                    role="status"
                                    className="mt-5 rounded-2xl border border-[var(--rf-green)]/30 bg-[var(--rf-green)]/10 p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2
                                            size={18}
                                            className="mt-0.5 shrink-0 text-[var(--rf-green-dark)]"
                                        />

                                        <p className="text-sm leading-5 text-[var(--rf-midnight)]">
                                            Application submitted
                                            successfully.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="
                                    mt-7 flex min-h-14 w-full
                                    items-center justify-center
                                    gap-2
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
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                "
                            >
                                {submitting ? (
                                    <>
                                        <Loader2
                                            size={18}
                                            className="animate-spin"
                                        />
                                        Submitting application...
                                    </>
                                ) : application?.status ===
                                    "REJECTED" ? (
                                    <>
                                        <FileCheck2
                                            size={18}
                                        />
                                        Reapply for review
                                    </>
                                ) : (
                                    <>
                                        <FileCheck2
                                            size={18}
                                        />
                                        Submit application
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
}