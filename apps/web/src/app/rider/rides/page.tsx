"use client";

import { Car, Clock3 } from "lucide-react";

export default function RiderRidesPage() {
    return (
        <div className="min-h-full p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--rf-midnight)]">
                        My Rides
                    </h1>

                    <p className="mt-1 text-sm text-[var(--rf-muted)]">
                        View your upcoming and previous rides.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <button
                        type="button"
                        className="
                            rounded-2xl border border-[var(--rf-border)]
                            bg-[var(--rf-surface)] p-5 text-left
                            shadow-sm transition
                            hover:-translate-y-0.5 hover:shadow-md
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-[var(--rf-green)]
                        "
                    >
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                            <Clock3 size={21} />
                        </div>

                        <h2 className="font-semibold text-[var(--rf-midnight)]">
                            Upcoming rides
                        </h2>

                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                            Your scheduled and active rides will appear here.
                        </p>
                    </button>

                    <button
                        type="button"
                        className="
                            rounded-2xl border border-[var(--rf-border)]
                            bg-[var(--rf-surface)] p-5 text-left
                            shadow-sm transition
                            hover:-translate-y-0.5 hover:shadow-md
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-[var(--rf-green)]
                        "
                    >
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--rf-midnight)]/5 text-[var(--rf-midnight)]">
                            <Car size={21} />
                        </div>

                        <h2 className="font-semibold text-[var(--rf-midnight)]">
                            Ride history
                        </h2>

                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                            Completed and cancelled rides will appear here.
                        </p>
                    </button>
                </div>

                <div className="mt-6 rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--rf-surface-muted)]">
                        <Car
                            size={22}
                            className="text-[var(--rf-muted)]"
                        />
                    </div>

                    <h2 className="mt-4 font-semibold text-[var(--rf-midnight)]">
                        No rides yet
                    </h2>

                    <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--rf-muted)]">
                        Once you book a RideFlow trip, your ride details will
                        appear here.
                    </p>
                </div>
            </div>
        </div>
    );
}