"use client";

import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";

import { Can } from "@/authorization/Can";
import { Permissions } from "@/authorization/permissions";
import { RideHistoryList } from "@/components/rides/ride-history-list";

export default function RiderRideHistoryPage() {
    return (
        <Can permission={Permissions.RIDER_RIDE_VIEW}>
            <main className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-4xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                    <div className="mb-6 flex items-center justify-between">
                        <Link
                            href="/rider/rides"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--rf-muted)] hover:text-[var(--rf-green-dark)] transition"
                        >
                            <ArrowLeft size={16} />
                            Active rides
                        </Link>
                    </div>

                    <div className="mb-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                                <History size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-[var(--rf-midnight)]">
                                    Ride History
                                </h1>
                                <p className="text-xs text-[var(--rf-muted)]">
                                    Search, filter, and review all your past RideFlow trips
                                </p>
                            </div>
                        </div>
                    </div>

                    <RideHistoryList audience="rider" />
                </div>
            </main>
        </Can>
    );
}
