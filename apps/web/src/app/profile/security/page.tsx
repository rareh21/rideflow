"use client";

import Link from "next/link";
import {
    ArrowLeft,
    ChevronRight,
    KeyRound,
    ShieldCheck,
    Smartphone,
    LogOut,
} from "lucide-react";

const securityItems = [
    {
        icon: KeyRound,
        title: "Change password",
        description: "Update your account password regularly.",
        href: "#change-password",
    },
    {
        icon: Smartphone,
        title: "Login activity",
        description: "Review recent access to your account.",
        href: "#login-activity",
    },
];

export default function SecurityPage() {
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
                            Security
                        </h1>
                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                            Keep your RideFlow account secure
                        </p>
                    </div>
                </div>

                {/* Security status */}
                <section className="mb-4 rounded-2xl bg-[var(--rf-midnight)] p-5 text-white">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--rf-green)]/15 text-[var(--rf-green)]">
                            <ShieldCheck className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="font-semibold">Account security</h2>
                            <p className="mt-1 text-sm leading-6 text-white/70">
                                Use a strong password and review account activity regularly.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Security controls */}
                <section className="overflow-hidden rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)]">
                    <div className="border-b border-[var(--rf-border)] px-5 py-4">
                        <h2 className="text-base font-semibold text-[var(--rf-text)]">
                            Security controls
                        </h2>
                    </div>

                    <div className="divide-y divide-[var(--rf-border)]">
                        {securityItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <a
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
                                </a>
                            );
                        })}
                    </div>
                </section>

                {/* Sessions */}
                <section className="mt-4 overflow-hidden rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)]">
                    <div className="px-5 py-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--rf-surface-muted)] text-[var(--rf-muted)]">
                                <LogOut className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-medium text-[var(--rf-text)]">
                                    Active sessions
                                </h2>
                                <p className="mt-1 text-sm leading-5 text-[var(--rf-muted)]">
                                    Sign out of other devices if you notice anything unusual.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}