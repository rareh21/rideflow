"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useBooking } from "@/context/booking-context";

const destinations = [
    {
        id: "madhapur",
        locationId: "596d2a57-754a-49d9-a174-15d553610510",
        label: "Madhapur",
        distance: "3.8 km away",
    },
    {
        id: "jubilee-hills",
        locationId: "420760e7-8055-4616-86f8-3381beb52058",
        label: "Jubilee Hills",
        distance: "6.2 km away",
    },
    {
        id: "hitech-city",
        locationId: "420760e7-8055-4616-86f8-3381beb52058",
        label: "Hitech City",
        distance: "5.1 km away",
    },
    {
        id: "kondapur",
        locationId: "596d2a57-754a-49d9-a174-15d553610510",
        label: "Kondapur",
        distance: "0.1 km away",
    },
];

export default function DestinationPage() {
    const router = useRouter();

    const { setDestination } = useBooking();

    const [query, setQuery] = useState("");

    const filteredDestinations = destinations.filter(
        (destination) =>
            destination.label
                .toLowerCase()
                .includes(query.toLowerCase()),
    );

    function selectDestination(
        destination: (typeof destinations)[number],
    ) {
        setDestination({
            id: destination.id,
            label: destination.label,
            locationId: destination.locationId,
        });

        router.push("/rider/route");
    }

    return (
        <main className="min-h-screen bg-rf-surface-muted px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-2xl">

                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-sm font-semibold text-rf-text-secondary transition hover:text-rf-green"
                >
                    ← Back
                </button>

                <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">

                    <div>
                        <p className="text-sm font-bold tracking-wide text-rf-green">
                            RIDEFLOW
                        </p>

                        <h1 className="mt-3 text-3xl font-bold tracking-tight">
                            Where should we take you?
                        </h1>

                        <p className="mt-2 text-sm text-rf-text-secondary">
                            Search places, streets or landmarks.
                        </p>
                    </div>

                    {/* Search */}
                    <div className="mt-8">
                        <label
                            htmlFor="destination"
                            className="text-sm font-semibold text-rf-text"
                        >
                            Destination
                        </label>

                        <div className="relative mt-2">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-rf-green">
                                ⌕
                            </span>

                            <input
                                id="destination"
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                type="text"
                                placeholder="Search destination"
                                autoFocus
                                className="h-14 w-full rounded-2xl border border-rf-border bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-rf-text-secondary/60 focus:border-rf-green focus:ring-4 focus:ring-rf-green/10"
                            />
                        </div>
                    </div>

                    {/* Current location */}
                    <button
                        type="button"
                        onClick={() => {
                            setDestination({
                                id: "current-location",
                                label: "Current location",
                            });

                            router.push("/rider/route");
                        }}
                        className="mt-5 flex w-full items-center gap-4 rounded-2xl bg-rf-surface-muted p-4 text-left transition hover:bg-rf-green/5"
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rf-green/10 text-rf-green">
                            ●
                        </span>

                        <div>
                            <p className="text-sm font-semibold">
                                Use current location
                            </p>

                            <p className="mt-1 text-xs text-rf-text-secondary">
                                Hyderabad
                            </p>
                        </div>
                    </button>

                    {/* Recent */}
                    <div className="mt-8">
                        <p className="text-xs font-bold uppercase tracking-wide text-rf-text-secondary">
                            Recent places
                        </p>

                        <div className="mt-3 space-y-2">
                            {filteredDestinations.length > 0 ? (
                                filteredDestinations.map(
                                    (destination) => (
                                        <button
                                            key={destination.id}
                                            type="button"
                                            onClick={() =>
                                                selectDestination(destination)
                                            }
                                            className="flex w-full items-center justify-between rounded-2xl bg-rf-surface-muted p-4 text-left transition hover:bg-rf-green/5"
                                        >
                                            <span className="text-sm font-semibold">
                                                {destination.label}
                                            </span>

                                            <span className="text-xs text-rf-text-secondary">
                                                {destination.distance}
                                            </span>
                                        </button>
                                    ),
                                )
                            ) : (
                                <div className="rounded-2xl bg-rf-surface-muted p-5">
                                    <p className="text-sm font-semibold">
                                        No places found
                                    </p>

                                    <p className="mt-1 text-xs text-rf-text-secondary">
                                        Try searching for another place.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </section>
            </div>
        </main>
    );
}