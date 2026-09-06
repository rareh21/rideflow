"use client";

import Link from "next/link";
import {
    ArrowLeft,
    ChevronRight,
    Eye,
    MapPin,
    Bell,
    Database,
    ShieldCheck,
} from "lucide-react";

const privacyItems = [
    {
        icon: Eye,
        title: "Profile visibility",
        description: "Control how your profile information is used.",
        href: "#profile-visibility",
    },
    {
        icon: MapPin,
        title: "Location access",
        description: "Manage how RideFlow uses your location.",
        href: "#location",
    },
    {
        icon: Bell,
        title: "Communication preferences",
        description: "Manage notifications and promotional messages.",
        href: "/profile/preferences",
    },
    {
        icon: Database,
        title: "Your data",
        description: "Learn how your RideFlow data is stored and used.",
        href: "#data",
    },
];

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-[var(--rf-surface-muted)]">
            <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <Link
                        href="/profile"
                        aria-label="Back to profile"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--rf-border)] bg-[var(--rf-surface)] text-[var(--rf-text)] transition hover:bg-[var(--rf-surface-muted)]"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>

                    <div>
                        <h1 className="text-xl font-semibold text-[var(--rf-text)]">
                            Privacy
                        </h1>
                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                            Manage your privacy and data preferences
                        </p>
                    </div>
                </div>

                {/* Privacy overview */}
                <section className="mb-4 rounded-2xl bg-[var(--rf-midnight)] p-5 text-white">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--rf-green)]/15 text-[var(--rf-green)]">
                            <ShieldCheck className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="font-semibold">Your privacy matters</h2>
                            <p className="mt-1 text-sm leading-6 text-white/70">
                                Review and manage how your information is used while using
                                RideFlow.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Settings */}
                <section className="overflow-hidden rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)]">
                    <div className="border-b border-[var(--rf-border)] px-5 py-4">
                        <h2 className="text-base font-semibold text-[var(--rf-text)]">
                            Privacy controls
                        </h2>
                    </div>

                    <div className="divide-y divide-[var(--rf-border)]">
                        {privacyItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--rf-surface-muted)]"
                                >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                                        <Icon className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-[var(--rf-text)]">
                                            {item.title}
                                        </p>

                                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                                            {item.description}
                                        </p>
                                    </div>

                                    <ChevronRight className="h-5 w-5 shrink-0 text-[var(--rf-muted)]" />
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Data information */}
                <section
                    id="data"
                    className="mt-4 rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5"
                >
                    <h2 className="font-semibold text-[var(--rf-text)]">
                        Information we use
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[var(--rf-muted)]">
                        RideFlow may use information such as your profile details, ride
                        information, saved locations, and preferences to provide and
                        improve the service.
                    </p>
                </section>
            </div>
        </main>
    );
}