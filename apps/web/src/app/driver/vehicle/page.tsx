"use client";

import {
    AlertCircle,
    ArrowLeft,
    Car,
    CheckCircle2,
    Loader2,
    Pencil,
    ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import {
    createVehicle,
    getMyVehicle,
    updateMyVehicle,
} from "@/lib/vehicles";

import type { Vehicle } from "@/lib/vehicles";

import { Button } from "@/components/ui/button";

type VehicleForm = {
    make: string;
    model: string;
    year: string;
    plateNumber: string;
};

const EMPTY_FORM: VehicleForm = {
    make: "",
    model: "",
    year: "",
    plateNumber: "",
};

export default function DriverVehiclePage() {
    const [vehicle, setVehicle] =
        useState<Vehicle | null>(null);

    const [form, setForm] =
        useState<VehicleForm>(EMPTY_FORM);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [editing, setEditing] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [success, setSuccess] =
        useState<string | null>(null);

    async function loadVehicle() {
        try {
            setLoading(true);
            setError(null);

            const data = await getMyVehicle();

            setVehicle(data);

            setForm({
                make: data.make,
                model: data.model,
                year: String(data.year),
                plateNumber: data.plateNumber,
            });
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Unable to load your vehicle.";

            /*
             * No vehicle is an expected empty state.
             */
            if (
                message
                    .toLowerCase()
                    .includes("vehicle not found")
            ) {
                setVehicle(null);
                setForm(EMPTY_FORM);
                setError(null);
                return;
            }

            setError(message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadVehicle();
    }, []);

    function updateField(
        field: keyof VehicleForm,
        value: string,
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setError(null);
        setSuccess(null);
    }

    function startEditing() {
        if (!vehicle) {
            return;
        }

        setForm({
            make: vehicle.make,
            model: vehicle.model,
            year: String(vehicle.year),
            plateNumber: vehicle.plateNumber,
        });

        setEditing(true);
        setError(null);
        setSuccess(null);
    }

    function cancelEditing() {
        if (vehicle) {
            setForm({
                make: vehicle.make,
                model: vehicle.model,
                year: String(vehicle.year),
                plateNumber: vehicle.plateNumber,
            });
        } else {
            setForm(EMPTY_FORM);
        }

        setEditing(false);
        setError(null);
        setSuccess(null);
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const make = form.make.trim();
        const model = form.model.trim();
        const plateNumber =
            form.plateNumber.trim().toUpperCase();

        const year = Number(form.year);

        if (!make || !model || !form.year || !plateNumber) {
            setError(
                "Please complete all vehicle details.",
            );
            return;
        }

        if (
            !Number.isInteger(year) ||
            year < 1990 ||
            year > 2100
        ) {
            setError(
                "Please enter a valid vehicle year between 1990 and 2100.",
            );
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const payload = {
                make,
                model,
                year,
                plateNumber,
            };

            const savedVehicle = vehicle
                ? await updateMyVehicle(payload)
                : await createVehicle(payload);

            setVehicle(savedVehicle);

            setForm({
                make: savedVehicle.make,
                model: savedVehicle.model,
                year: String(
                    savedVehicle.year,
                ),
                plateNumber:
                    savedVehicle.plateNumber,
            });

            setEditing(false);

            setSuccess(
                vehicle
                    ? "Vehicle details updated successfully."
                    : "Vehicle added successfully.",
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save vehicle details.",
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                    <div className="animate-pulse space-y-6">
                        <div className="h-4 w-32 rounded bg-[var(--rf-border)]" />

                        <div className="h-10 w-64 rounded-lg bg-[var(--rf-border)]" />

                        <div className="h-80 rounded-3xl bg-[var(--rf-border)]" />
                    </div>
                </div>
            </main>
        );
    }

    if (error && !vehicle && !editing) {
        return (
            <main className="min-h-full bg-[var(--rf-surface-muted)]">
                <div className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                    <Link
                        href="/driver"
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
                        Back to dashboard
                    </Link>

                    <section className="mt-6 rounded-3xl border border-red-200 bg-[var(--rf-surface)] p-6 shadow-sm sm:p-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                            <AlertCircle
                                size={23}
                                className="text-[var(--rf-danger)]"
                            />
                        </div>

                        <h1 className="mt-5 text-xl font-bold text-[var(--rf-midnight)]">
                            Unable to load vehicle
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-[var(--rf-muted)]">
                            {error}
                        </p>

                        <Button
                            variant="primary"
                            className="mt-6"
                            onClick={() =>
                                void loadVehicle()
                            }
                        >
                            Try again
                        </Button>
                    </section>
                </div>
            </main>
        );
    }

    const showForm =
        !vehicle || editing;

    return (
        <main className="min-h-full bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">
                <Link
                    href="/driver"
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
                    Back to dashboard
                </Link>

                <header className="mt-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-green-dark)]">
                        Driver Console
                    </p>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--rf-midnight)] sm:text-3xl">
                        Vehicle
                    </h1>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--rf-muted)]">
                        Manage the vehicle associated
                        with your RideFlow driver
                        account.
                    </p>
                </header>

                {success && (
                    <div
                        role="status"
                        className="
                            mt-6 flex items-start gap-3
                            rounded-2xl
                            border border-[var(--rf-green)]/30
                            bg-[var(--rf-green)]/10
                            p-4
                        "
                    >
                        <CheckCircle2
                            size={19}
                            className="mt-0.5 shrink-0 text-[var(--rf-green-dark)]"
                        />

                        <p className="text-sm leading-5 text-[var(--rf-midnight)]">
                            {success}
                        </p>
                    </div>
                )}

                {showForm ? (
                    <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] shadow-sm">
                        <div className="bg-[var(--rf-midnight)] p-6 text-white sm:p-8">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--rf-green)] text-[var(--rf-midnight)]">
                                {vehicle ? (
                                    <Pencil size={22} />
                                ) : (
                                    <Car size={22} />
                                )}
                            </div>

                            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[var(--rf-green)]">
                                Vehicle details
                            </p>

                            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                                {vehicle
                                    ? "Edit vehicle"
                                    : "Add your vehicle"}
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-white/65">
                                {vehicle
                                    ? "Keep your vehicle information accurate and up to date."
                                    : "Add the vehicle you'll use for RideFlow trips."}
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-6 sm:p-8"
                        >
                            <VehicleInput
                                id="make"
                                label="Make"
                                value={form.make}
                                placeholder="e.g. Maruti"
                                disabled={saving}
                                onChange={(value) =>
                                    updateField(
                                        "make",
                                        value,
                                    )
                                }
                            />

                            <VehicleInput
                                id="model"
                                label="Model"
                                value={form.model}
                                placeholder="e.g. Swift"
                                disabled={saving}
                                onChange={(value) =>
                                    updateField(
                                        "model",
                                        value,
                                    )
                                }
                            />

                            <VehicleInput
                                id="year"
                                label="Year"
                                type="number"
                                value={form.year}
                                placeholder="e.g. 2024"
                                min={1990}
                                max={2100}
                                disabled={saving}
                                onChange={(value) =>
                                    updateField(
                                        "year",
                                        value,
                                    )
                                }
                            />

                            <VehicleInput
                                id="plateNumber"
                                label="Registration number"
                                value={form.plateNumber}
                                placeholder="e.g. BR01AB1234"
                                disabled={saving}
                                onChange={(value) =>
                                    updateField(
                                        "plateNumber",
                                        value.toUpperCase(),
                                    )
                                }
                            />

                            {error && (
                                <div
                                    role="alert"
                                    className="
                                        flex items-start gap-3
                                        rounded-2xl
                                        border border-red-200
                                        bg-red-50
                                        p-4
                                    "
                                >
                                    <AlertCircle
                                        size={18}
                                        className="mt-0.5 shrink-0 text-[var(--rf-danger)]"
                                    />

                                    <p className="text-sm leading-5 text-red-800">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                                {vehicle && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={saving}
                                        onClick={
                                            cancelEditing
                                        }
                                    >
                                        Cancel
                                    </Button>
                                )}

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2
                                                size={17}
                                                className="animate-spin"
                                            />
                                            Saving...
                                        </>
                                    ) : vehicle ? (
                                        "Save changes"
                                    ) : (
                                        "Add vehicle"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </section>
                ) : (
                    <section className="mt-6 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 shadow-sm sm:p-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--rf-green)]/10">
                                    <Car
                                        size={26}
                                        className="text-[var(--rf-green-dark)]"
                                    />
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-muted)]">
                                        Your vehicle
                                    </p>

                                    <h2 className="mt-1 text-xl font-bold text-[var(--rf-midnight)]">
                                        {vehicle?.make}{" "}
                                        {vehicle?.model}
                                    </h2>

                                    <p className="mt-1 text-sm text-[var(--rf-muted)]">
                                        {vehicle?.plateNumber}
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={startEditing}
                            >
                                <Pencil size={16} />
                            </Button>
                        </div>

                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            <VehicleDetail
                                label="Make"
                                value={
                                    vehicle?.make ?? "—"
                                }
                            />

                            <VehicleDetail
                                label="Model"
                                value={
                                    vehicle?.model ?? "—"
                                }
                            />

                            <VehicleDetail
                                label="Year"
                                value={
                                    vehicle
                                        ? String(
                                            vehicle.year,
                                        )
                                        : "—"
                                }
                            />

                            <VehicleDetail
                                label="Registration"
                                value={
                                    vehicle?.plateNumber ??
                                    "—"
                                }
                            />
                        </div>

                        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[var(--rf-surface-muted)] p-4">
                            <ShieldCheck
                                size={19}
                                className="mt-0.5 shrink-0 text-[var(--rf-green-dark)]"
                            />

                            <p className="text-sm leading-5 text-[var(--rf-muted)]">
                                Keep your vehicle
                                information accurate
                                and up to date for your
                                RideFlow driver profile.
                            </p>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}

function VehicleInput({
    id,
    label,
    value,
    placeholder,
    disabled,
    type = "text",
    min,
    max,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    disabled: boolean;
    type?: "text" | "number";
    min?: number;
    max?: number;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="block text-sm font-semibold text-[var(--rf-midnight)]"
            >
                {label}
            </label>

            <input
                id={id}
                name={id}
                type={type}
                value={value}
                placeholder={placeholder}
                min={min}
                max={max}
                required
                disabled={disabled}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="
                    mt-2 min-h-12 w-full
                    rounded-2xl
                    border border-[var(--rf-border)]
                    bg-[var(--rf-surface)]
                    px-4
                    text-sm font-medium
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
    );
}

function VehicleDetail({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl bg-[var(--rf-surface-muted)] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-muted)]">
                {label}
            </p>

            <p className="mt-2 text-sm font-semibold text-[var(--rf-midnight)]">
                {value}
            </p>
        </div>
    );
}