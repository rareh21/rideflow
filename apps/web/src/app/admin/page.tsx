"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ChevronRight,
    Clock3,
    FileCheck2,
    ShieldCheck,
    UserCheck,
    Users,
    Zap,
} from "lucide-react";

import { getDriverApplications, type AdminDriverApplication } from "@/lib/drivers";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
    const [applications, setApplications] = useState<AdminDriverApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDriverApplications()
            .then(setApplications)
            .catch(() => setApplications([]))
            .finally(() => setLoading(false));
    }, []);

    const pendingCount = applications.filter((a) => a.status === "PENDING").length;
    const approvedCount = applications.filter((a) => a.status === "APPROVED").length;
    const totalCount = applications.length;

    return (
        <div className="min-h-full bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
                {/* Header */}
                <header>
                    <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--rf-green)]/15 text-[var(--rf-green-dark)]">
                            <ShieldCheck size={18} />
                        </span>
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-green-dark)]">
                            Admin Operations
                        </p>
                    </div>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--rf-midnight)] sm:text-3xl">
                        Platform Overview
                    </h1>

                    <p className="mt-1 text-sm text-[var(--rf-muted)]">
                        Manage platform verifications, drivers, and user operations.
                    </p>
                </header>

                {/* Urgent Action Alert if Pending Applications */}
                {!loading && pendingCount > 0 && (
                    <section className="mt-6 overflow-hidden rounded-3xl bg-[var(--rf-midnight)] p-6 text-white shadow-sm sm:p-7">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-400">
                                    <Clock3 size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                        Action Required
                                    </p>
                                    <h2 className="mt-1 text-xl font-bold">
                                        {pendingCount} Driver {pendingCount === 1 ? "Application" : "Applications"} Awaiting Review
                                    </h2>
                                    <p className="mt-1 text-sm text-white/70">
                                        Riders have applied to become drivers. Review their licence details to activate them.
                                    </p>
                                </div>
                            </div>

                            <Link href="/admin/driver-applications">
                                <Button variant="primary" className="whitespace-nowrap">
                                    Review Now
                                    <ChevronRight size={16} />
                                </Button>
                            </Link>
                        </div>
                    </section>
                )}

                {/* Metric Cards */}
                <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DashboardCard
                        icon={<Clock3 size={22} />}
                        title="Pending Applications"
                        value={loading ? "..." : String(pendingCount)}
                        description="Driver KYC submissions awaiting verification."
                        href="/admin/driver-applications"
                        highlight={pendingCount > 0}
                    />

                    <DashboardCard
                        icon={<UserCheck size={22} />}
                        title="Approved Drivers"
                        value={loading ? "..." : String(approvedCount)}
                        description="Verified and active drivers on RideFlow."
                        href="/admin/driver-applications"
                    />

                    <DashboardCard
                        icon={<FileCheck2 size={22} />}
                        title="Total Submissions"
                        value={loading ? "..." : String(totalCount)}
                        description="Lifetime driver verification applications."
                        href="/admin/driver-applications"
                    />
                </section>

                {/* Quick Navigation Cards */}
                <section className="mt-8">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--rf-muted)]">
                        Quick Actions
                    </h2>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <ActionCard
                            icon={<FileCheck2 size={22} />}
                            title="Review Driver Applications"
                            description="Inspect submitted driving licences, approve verified drivers, or provide feedback on rejected applications."
                            href="/admin/driver-applications"
                        />

                        <ActionCard
                            icon={<Zap size={22} />}
                            title="Driver Console"
                            description="Access the driver operations portal to test availability, active rides, and vehicle registration."
                            href="/driver"
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
    highlight = false,
}: {
    icon: React.ReactNode;
    title: string;
    value: string;
    description: string;
    href?: string;
    highlight?: boolean;
}) {
    const cardContent = (
        <div
            className={`rounded-3xl border p-6 transition duration-200 ${
                highlight
                    ? "border-amber-300 bg-amber-50/40 shadow-sm"
                    : "border-[var(--rf-border)] bg-[var(--rf-surface)] shadow-sm"
            }`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        highlight
                            ? "bg-amber-100 text-amber-800"
                            : "bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]"
                    }`}
                >
                    {icon}
                </div>
                <p className="text-sm font-semibold text-[var(--rf-muted)]">{title}</p>
            </div>

            <p className="mt-5 text-3xl font-extrabold text-[var(--rf-midnight)]">{value}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--rf-muted)]">{description}</p>
        </div>
    );

    if (!href) return cardContent;

    return (
        <Link href={href} className="block transition hover:-translate-y-0.5">
            {cardContent}
        </Link>
    );
}

function ActionCard({
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
            className="group flex items-start justify-between rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 shadow-sm transition hover:border-[var(--rf-green)] hover:shadow-md"
        >
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)] transition group-hover:scale-105">
                    {icon}
                </div>
                <div>
                    <h3 className="text-base font-bold text-[var(--rf-midnight)] group-hover:text-[var(--rf-green-dark)]">
                        {title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--rf-muted)]">{description}</p>
                </div>
            </div>

            <ChevronRight
                size={20}
                className="mt-1 shrink-0 text-[var(--rf-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--rf-green-dark)]"
            />
        </Link>
    );
}