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

    // Auto-detect current location automatically on mount — no button click required
    useEffect(() => {
        // If pickup is valid and not placeholder, use it
        if (
            pickup?.locationId &&
            pickup.locationId !== "596d2a57-754a-49d9-a174-15d553610510" &&
            pickup.label &&
            pickup.label !== "Current location · Hyderabad"
        ) {
            setLocalPickup({ id: pickup.locationId, label: pickup.label });
            return;
        }

        // Otherwise automatically auto-detect GPS position on mount
        if (typeof window !== "undefined" && navigator.geolocation) {
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
                    } catch (err) {
                        console.error("Auto-detect location error", err);
                    }
                },
                (err) => {
                    console.warn("Geolocation permission error", err);
                },
                { enableHighAccuracy: true, timeout: 8000 },
            );
        }
    }, [pickup, setPickup]);

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
                            placeholder="Search or detecting current pickup..."
                            initialValue={localPickup?.label || ""}
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
