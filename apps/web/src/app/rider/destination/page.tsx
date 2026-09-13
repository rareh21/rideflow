"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { useBooking } from "@/context/booking-context";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { reverseGeocodeLocation } from "@/lib/locations";

export default function DestinationPage() {
    const router = useRouter();
    const { pickup, setPickup, setDestination } = useBooking();

    const [localPickup, setLocalPickup] = useState<{ id: string; label: string } | null>(null);
    const [localDestination, setLocalDestination] = useState<{ id: string; label: string } | null>(null);

    // Auto-detect current location on mount if pickup is hardcoded default or not set
    useEffect(() => {
        if (!pickup || pickup.label === "Current location · Hyderabad" || !pickup.locationId) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            const resolved = await reverseGeocodeLocation(
                                position.coords.latitude,
                                position.coords.longitude,
                            );
                            setLocalPickup({ id: resolved.id, label: resolved.label });
                            setPickup({
                                label: resolved.label,
                                locationId: resolved.id,
                            });
                        } catch {
                            // Fallback gracefully if auto-detection fails silently on mount
                        }
                    },
                    () => {},
                    { enableHighAccuracy: true, timeout: 5000 },
                );
            }
        } else if (pickup && !localPickup) {
            setLocalPickup({ id: pickup.locationId, label: pickup.label });
        }
    }, [pickup, localPickup, setPickup]);

    function continueToRoute() {
        if (!localPickup || !localDestination) return;

        setPickup({
            label: localPickup.label,
            locationId: localPickup.id,
        });

        setDestination({
            id: localDestination.id,
            label: localDestination.label,
            locationId: localDestination.id,
        });

        router.push("/rider/route");
    }

    const canContinue = !!localPickup?.id && !!localDestination?.id;

    return (
        <main className="min-h-screen bg-rf-surface-muted px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-2xl">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-sm font-semibold text-rf-muted transition hover:text-rf-green"
                >
                    ← Back
                </button>

                <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
                    <p className="text-sm font-bold tracking-wide text-rf-green">
                        RIDEFLOW
                    </p>

                    <h1 className="mt-3 text-3xl font-bold tracking-tight">
                        Plan your trip
                    </h1>

                    <div className="mt-7 space-y-6">
                        <LocationAutocomplete
                            label="Pickup location"
                            placeholder="Search pickup..."
                            showAutoDetect
                            initialValue={
                                localPickup?.label && !localPickup.label.includes("(")
                                    ? localPickup.label
                                    : pickup?.label && !pickup.label.includes("(") && pickup.label !== "Current location · Hyderabad"
                                    ? pickup.label
                                    : ""
                            }
                            onLocationSelect={(id, label) => setLocalPickup(id ? { id, label } : null)}
                        />

                        <LocationAutocomplete
                            label="Drop-off location"
                            placeholder="Search destination..."
                            autoFocus
                            onLocationSelect={(id, label) => setLocalDestination(id ? { id, label } : null)}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={continueToRoute}
                        disabled={!canContinue}
                        className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-rf-green text-sm font-semibold text-white transition hover:bg-rf-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {canContinue ? "Review route" : "Select locations"}
                        {canContinue && <ArrowRight size={17} />}
                    </button>
                </section>
            </div>
        </main>
    );
}
