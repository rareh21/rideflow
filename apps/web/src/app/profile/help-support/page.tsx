"use client";

import Link from "next/link";
import {
    ArrowLeft,
    ChevronDown,
    Mail,
    MessageCircle,
    HelpCircle,
    FileText,
} from "lucide-react";
import { useState } from "react";

const faqs = [
    {
        question: "How do I book a ride?",
        answer:
            "Choose your destination from the rider dashboard, select a ride option, choose your payment method, and confirm your ride.",
    },
    {
        question: "How can I cancel a ride?",
        answer:
            "Open your active ride and use the cancellation option when it is available.",
    },
    {
        question: "How can I update my profile?",
        answer:
            "Open Profile and select Edit Profile to update your account information.",
    },
    {
        question: "How do I change my payment preference?",
        answer:
            "Open Profile → Payment Settings and select your preferred default payment method.",
    },
];

export default function HelpSupportPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

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
                            Help & Support
                        </h1>
                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                            Find answers or get help with RideFlow
                        </p>
                    </div>
                </div>

                {/* Support options */}
                <section className="grid gap-3 sm:grid-cols-2">
                    <a
                        href="mailto:support@rideflow.in"
                        className="rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-sm"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                            <Mail className="h-5 w-5" />
                        </div>

                        <h2 className="mt-4 font-semibold text-[var(--rf-text)]">
                            Email support
                        </h2>

                        <p className="mt-1 text-sm leading-5 text-[var(--rf-muted)]">
                            Contact our support team by email.
                        </p>
                    </a>

                    <button
                        type="button"
                        className="rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                            <MessageCircle className="h-5 w-5" />
                        </div>

                        <h2 className="mt-4 font-semibold text-[var(--rf-text)]">
                            Contact support
                        </h2>

                        <p className="mt-1 text-sm leading-5 text-[var(--rf-muted)]">
                            Get help with rides, payments, or your account.
                        </p>
                    </button>
                </section>

                {/* FAQ */}
                <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)]">
                    <div className="border-b border-[var(--rf-border)] px-5 py-4">
                        <div className="flex items-center gap-3">
                            <HelpCircle className="h-5 w-5 text-[var(--rf-green-dark)]" />

                            <h2 className="font-semibold text-[var(--rf-text)]">
                                Frequently asked questions
                            </h2>
                        </div>
                    </div>

                    <div className="divide-y divide-[var(--rf-border)]">
                        {faqs.map((faq, index) => {
                            const isOpen = openFaq === index;

                            return (
                                <div key={faq.question}>
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(isOpen ? null : index)}
                                        aria-expanded={isOpen}
                                        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[var(--rf-surface-muted)]"
                                    >
                                        <FileText className="h-5 w-5 shrink-0 text-[var(--rf-muted)]" />

                                        <span className="flex-1 text-sm font-medium text-[var(--rf-text)]">
                                            {faq.question}
                                        </span>

                                        <ChevronDown
                                            className={`h-5 w-5 shrink-0 text-[var(--rf-muted)] transition-transform ${isOpen ? "rotate-180" : ""
                                                }`}
                                        />
                                    </button>

                                    {isOpen && (
                                        <div className="px-5 pb-4 pl-14">
                                            <p className="text-sm leading-6 text-[var(--rf-muted)]">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Footer */}
                <p className="mt-5 text-center text-xs text-[var(--rf-muted)]">
                    RideFlow Support
                </p>
            </div>
        </main>
    );
}