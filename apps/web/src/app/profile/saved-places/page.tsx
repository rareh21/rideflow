"use client";

import Link from "next/link";
import {
    ArrowLeft,
    BriefcaseBusiness,
    Home,
    MapPin,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
    createSavedPlace,
    deleteSavedPlace,
    getSavedPlaces,
    updateSavedPlace,
    type SavedPlace,
} from "@/lib/users";

type PlaceForm = {
    label: string;
    address: string;
    latitude: string;
    longitude: string;
};

const emptyForm: PlaceForm = {
    label: "",
    address: "",
    latitude: "",
    longitude: "",
};

function PlaceIcon({ label }: { label: string }) {
    const normalized = label.toLowerCase();

    if (normalized === "home") {
        return <Home className="h-5 w-5" />;
    }

    if (normalized === "work") {
        return <BriefcaseBusiness className="h-5 w-5" />;
    }

    return <MapPin className="h-5 w-5" />;
}

export default function SavedPlacesPage() {
    const [places, setPlaces] = useState<SavedPlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formOpen, setFormOpen] = useState(false);
    const [editingPlace, setEditingPlace] =
        useState<SavedPlace | null>(null);

    const [form, setForm] = useState<PlaceForm>(emptyForm);

    async function loadPlaces() {
        try {
            setLoading(true);
            setError(null);

            const data = await getSavedPlaces();
            setPlaces(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load saved places.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadPlaces();
    }, []);

    function openCreate() {
        setEditingPlace(null);
        setForm(emptyForm);
        setFormOpen(true);
    }

    function openEdit(place: SavedPlace) {
        setEditingPlace(place);

        setForm({
            label: place.label,
            address: place.address,
            latitude: String(place.latitude),
            longitude: String(place.longitude),
        });

        setFormOpen(true);
    }

    async function handleSave(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const latitude = Number(form.latitude);
        const longitude = Number(form.longitude);

        if (
            !form.label.trim() ||
            !form.address.trim() ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {
            setError("Please provide valid place information.");
            return;
        }

        try {
            setSaving(true);
            setError(null);

            if (editingPlace) {
                const updated = await updateSavedPlace(
                    editingPlace.id,
                    {
                        label: form.label,
                        address: form.address,
                        latitude,
                        longitude,
                    },
                );

                setPlaces((current) =>
                    current.map((place) =>
                        place.id === updated.id ? updated : place,
                    ),
                );
            } else {
                const created = await createSavedPlace({
                    label: form.label,
                    address: form.address,
                    latitude,
                    longitude,
                });

                setPlaces((current) => [...current, created]);
            }

            setFormOpen(false);
            setEditingPlace(null);
            setForm(emptyForm);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save this place.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(place: SavedPlace) {
        const confirmed = window.confirm(
            `Remove "${place.label}" from saved places?`,
        );

        if (!confirmed) return;

        try {
            setError(null);

            await deleteSavedPlace(place.id);

            setPlaces((current) =>
                current.filter((item) => item.id !== place.id),
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to remove this place.",
            );
        }
    }

    return (
        <main className="min-h-screen bg-[var(--rf-surface-muted)]">
            <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-3">
                    <Link
                        href="/profile"
                        aria-label="Back to profile"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--rf-border)] bg-[var(--rf-surface)] text-[var(--rf-text)]"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>

                    <div className="flex-1">
                        <h1 className="text-xl font-semibold text-[var(--rf-text)]">
                            Saved Places
                        </h1>

                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                            Save frequently used destinations
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="flex h-10 items-center gap-2 rounded-xl bg-[var(--rf-green)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--rf-green-dark)]"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add</span>
                    </button>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--rf-danger)]"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <span>{error}</span>

                            <button
                                type="button"
                                onClick={loadPlaces}
                                className="font-semibold underline"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-20 animate-pulse rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)]"
                            />
                        ))}
                    </div>
                ) : places.length === 0 ? (
                    <section className="rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] px-6 py-12 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                            <MapPin className="h-6 w-6" />
                        </div>

                        <h2 className="mt-4 font-semibold text-[var(--rf-text)]">
                            No saved places yet
                        </h2>

                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--rf-muted)]">
                            Save Home, Work, or any frequently visited place to make
                            booking your next ride faster.
                        </p>

                        <button
                            type="button"
                            onClick={openCreate}
                            className="mt-5 rounded-xl bg-[var(--rf-green)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--rf-green-dark)]"
                        >
                            Add your first place
                        </button>
                    </section>
                ) : (
                    <section className="overflow-hidden rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)]">
                        <div className="divide-y divide-[var(--rf-border)]">
                            {places.map((place) => (
                                <div
                                    key={place.id}
                                    className="flex items-center gap-4 px-5 py-4"
                                >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                                        <PlaceIcon label={place.label} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-[var(--rf-text)]">
                                            {place.label}
                                        </p>

                                        <p className="mt-1 truncate text-sm text-[var(--rf-muted)]">
                                            {place.address}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(place)}
                                            aria-label={`Edit ${place.label}`}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--rf-muted)] hover:bg-[var(--rf-surface-muted)] hover:text-[var(--rf-text)]"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(place)}
                                            aria-label={`Delete ${place.label}`}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--rf-muted)] hover:bg-red-50 hover:text-[var(--rf-danger)]"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {formOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--rf-midnight)]/50 p-0 sm:items-center sm:p-4">
                        <div className="w-full max-w-lg rounded-t-3xl bg-[var(--rf-surface)] p-5 sm:rounded-2xl">
                            <h2 className="text-lg font-semibold text-[var(--rf-text)]">
                                {editingPlace
                                    ? "Edit saved place"
                                    : "Add saved place"}
                            </h2>

                            <form
                                onSubmit={handleSave}
                                className="mt-5 space-y-4"
                            >
                                <input
                                    value={form.label}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            label: e.target.value,
                                        })
                                    }
                                    placeholder="Label e.g. Home"
                                    maxLength={50}
                                    className="w-full rounded-xl border border-[var(--rf-border)] bg-[var(--rf-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--rf-green)]"
                                />

                                <input
                                    value={form.address}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            address: e.target.value,
                                        })
                                    }
                                    placeholder="Address"
                                    maxLength={300}
                                    className="w-full rounded-xl border border-[var(--rf-border)] bg-[var(--rf-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--rf-green)]"
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        value={form.latitude}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                latitude: e.target.value,
                                            })
                                        }
                                        placeholder="Latitude"
                                        inputMode="decimal"
                                        className="w-full rounded-xl border border-[var(--rf-border)] px-4 py-3 text-sm outline-none focus:border-[var(--rf-green)]"
                                    />

                                    <input
                                        value={form.longitude}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                longitude: e.target.value,
                                            })
                                        }
                                        placeholder="Longitude"
                                        inputMode="decimal"
                                        className="w-full rounded-xl border border-[var(--rf-border)] px-4 py-3 text-sm outline-none focus:border-[var(--rf-green)]"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormOpen(false)}
                                        className="flex-1 rounded-xl border border-[var(--rf-border)] px-4 py-3 text-sm font-semibold text-[var(--rf-text)]"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 rounded-xl bg-[var(--rf-green)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                                    >
                                        {saving ? "Saving..." : "Save place"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}