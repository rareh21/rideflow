"use client";

import Link from "next/link";
import {
    ArrowLeft,
    ChevronRight,
    Home,
    MapPin,
    Plus,
    BriefcaseBusiness,
} from "lucide-react";

type SavedPlace = {
    id: string;
    label: string;
    address: string;
    icon: "home" | "work" | "other";
};

const savedPlaces: SavedPlace[] = [
    {
        id: "home",
        label: "Home",
        address: "Add your home address",
        icon: "home",
    },
    {
        id: "work",
        label: "Work",
        address: "Add your work address",
        icon: "work",
    },
];

function PlaceIcon({ type }: { type: SavedPlace["icon"] }) {
    if (type === "home") {
        return <Home className="h-5 w-5" />;
    }

    if (type === "work") {
        return <BriefcaseBusiness className="h-5 w-5" />;
    }

    return <MapPin className="h-5 w-5" />;
}

export default function SavedPlacesPage() {
    return (
        <main className="min-h-screen bg-[var(--rf-surface-muted)]">
            <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <Link
                        href="/profile"
                        aria-label="Back to profile"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--rf-border)] bg-[var(--rf-surface)] text-[var(--rf-text)] transition hover:bg-[var(--rf-surface-muted)]"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>

                    <div>
                        <h1 className="text-xl font-semibold text-[var(--rf-text)]">
                            Saved Places
                        </h1>
                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                            Save frequently used places for faster booking
                        </p>
                    </div>
                </div>

                {/* Places */}
                <section
                    aria-labelledby="saved-places-heading"
                    className="overflow-hidden rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)]"
                >
                    <div className="border-b border-[var(--rf-border)] px-5 py-4">
                        <h2
                            id="saved-places-heading"
                            className="text-base font-semibold text-[var(--rf-text)]"
                        >
                            Your places
                        </h2>
                    </div>

                    <div className="divide-y divide-[var(--rf-border)]">
                        {savedPlaces.map((place) => (
                            <button
                                key={place.id}
                                type="button"
                                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[var(--rf-surface-muted)]"
                            >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                                    <PlaceIcon type={place.icon} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-[var(--rf-text)]">
                                        {place.label}
                                    </p>

                                    <p className="mt-1 truncate text-sm text-[var(--rf-muted)]">
                                        {place.address}
                                    </p>
                                </div>

                                <ChevronRight className="h-5 w-5 shrink-0 text-[var(--rf-muted)]" />
                            </button>
                        ))}
                    </div>

                    {/* Add place */}
                    <div className="border-t border-[var(--rf-border)] p-4">
                        <button
                            type="button"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--rf-green)] px-4 py-3 text-sm font-semibold text-[var(--rf-green-dark)] transition hover:bg-[var(--rf-green)]/5"
                        >
                            <Plus className="h-4 w-4" />
                            Add a saved place
                        </button>
                    </div>
                </section>

                {/* Info */}
                <div className="mt-4 rounded-xl border border-[var(--rf-border)] bg-[var(--rf-surface)] px-4 py-3">
                    <p className="text-xs leading-5 text-[var(--rf-muted)]">
                        Saved places make it quicker to choose common pickup and
                        destination locations when booking a ride.
                    </p>
                </div>
            </div>
        </main>
    );
}