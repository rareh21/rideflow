"use client";

import { useRouter } from "next/navigation";

import { useBooking } from "@/context/booking-context";
import { RIDE_OPTIONS, type RideOption } from "@/types/ride";

export default function RideOptionsPage() {
    const router = useRouter();

    const {
        pickup,
        destination,
        selectedRide,
        selectRide,
    } = useBooking();

    if (!destination) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-rf-surface-muted px-6">
                <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-bold">
                        Choose a destination first
                    </h1>

                    <button
                        type="button"
                        onClick={() =>
                            router.push("/rider/destination")
                        }
                        className="mt-5 rounded-xl bg-rf-green px-5 py-3 text-sm font-semibold text-white"
                    >
                        Choose destination
                    </button>
                </div>
            </main>
        );
    }

    function handleSelect(ride: RideOption) {
        selectRide(ride);
        router.push("/rider/payment");
    }

    return (
        <main className="min-h-screen bg-rf-surface-muted px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-3xl">

                <button
                    type="button"
                    onClick={() => router.push("/rider/route")}
                    className="text-sm font-semibold text-rf-text-secondary transition hover:text-rf-green"
                >
                    ← Back to route
                </button>

                <section className="mt-6">

                    <div>
                        <p className="text-sm font-bold tracking-wide text-rf-green">
                            RIDEFLOW
                        </p>

                        <h1 className="mt-3 text-3xl font-bold tracking-tight">
                            Choose your ride
                        </h1>

                        <p className="mt-2 text-sm text-rf-text-secondary">
                            Comfortable options with clear pricing.
                        </p>
                    </div>

                    {/* Trip summary */}
                    <div className="mt-6 rounded-2xl bg-rf-midnight p-5 text-white">
                        <p className="text-xs font-semibold uppercase tracking-wide text-rf-green">
                            Your trip
                        </p>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-white/60">
                                    Pickup
                                </p>

                                <p className="text-sm font-semibold">
                                    {pickup?.label}
                                </p>
                            </div>

                            <span className="hidden text-white/30 sm:block">
                                →
                            </span>

                            <div className="sm:text-right">
                                <p className="text-sm text-white/60">
                                    Destination
                                </p>

                                <p className="text-sm font-semibold">
                                    {destination.label}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ride options */}
                    <div className="mt-6 space-y-3">
                        {RIDE_OPTIONS.map((ride) => {
                            const selected =
                                selectedRide?.id === ride.id;

                            return (
                                <button
                                    key={ride.id}
                                    type="button"
                                    onClick={() => handleSelect(ride)}
                                    className={[
                                        "w-full rounded-3xl border bg-white p-5 text-left transition",
                                        selected
                                            ? "border-rf-green ring-4 ring-rf-green/10"
                                            : "border-rf-border hover:border-rf-green hover:shadow-sm",
                                    ].join(" ")}
                                >
                                    <div className="flex items-start gap-4">

                                        {/* Vehicle icon */}
                                        <div
                                            className={[
                                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                                                selected
                                                    ? "bg-rf-green text-white"
                                                    : "bg-rf-green/10 text-rf-green",
                                            ].join(" ")}
                                        >
                                            🚗
                                        </div>

                                        <div className="min-w-0 flex-1">

                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h2 className="text-base font-bold">
                                                        {ride.name}
                                                    </h2>

                                                    <p className="mt-1 text-xs text-rf-text-secondary">
                                                        {ride.description}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-base font-bold">
                                                        ₹{ride.fare}
                                                    </p>

                                                    <p className="mt-1 text-xs text-rf-text-secondary">
                                                        {ride.etaMinutes} min
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center gap-4 text-xs text-rf-text-secondary">
                                                <span>
                                                    {ride.seats} seats
                                                </span>

                                                <span>
                                                    •
                                                </span>

                                                <span>
                                                    Upfront estimate
                                                </span>
                                            </div>

                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Pricing note */}
                    <div className="mt-5 rounded-2xl bg-rf-green/5 p-4">
                        <p className="text-xs font-semibold text-rf-text">
                            Clear pricing
                        </p>

                        <p className="mt-1 text-xs text-rf-text-secondary">
                            Your estimated fare is shown before you
                            request the ride.
                        </p>
                    </div>

                </section>
            </div>
        </main>
    );
}