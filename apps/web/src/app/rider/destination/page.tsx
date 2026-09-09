"use client";

import {
    ArrowRight,
    ChevronDown,
    MapPin,
    Search,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useBooking } from "@/context/booking-context";

const destinations = [
    {
        id: "madhapur",
        locationId: "596d2a57-754a-49d9-a174-15d553610510",
        label: "Madhapur",
        address: "Hyderabad, Telangana",
        distance: "3.8 km away",
    },
    {
        id: "jubilee-hills",
        locationId: "420760e7-8055-4616-86f8-3381beb52058",
        label: "Jubilee Hills",
        address: "Hyderabad, Telangana",
        distance: "6.2 km away",
    },
    {
        id: "hitech-city",
        locationId: "420760e7-8055-4616-86f8-3381beb52058",
        label: "Hitech City",
        address: "Hyderabad, Telangana",
        distance: "5.1 km away",
    },
    {
        id: "kondapur",
        locationId: "596d2a57-754a-49d9-a174-15d553610510",
        label: "Kondapur",
        address: "Hyderabad, Telangana",
        distance: "0.1 km away",
    },
] as const;

export default function DestinationPage() {
    const router = useRouter();
    const { pickup, setDestination } = useBooking();

    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(true);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [selectedDestination, setSelectedDestination] = useState<
        (typeof destinations)[number] | null
    >(null);

    const filteredDestinations = useMemo(
        () => destinations.filter((destination) =>
            destination.label.toLowerCase().includes(query.trim().toLowerCase()),
        ),
        [query],
    );

    function chooseDestination(destination: (typeof destinations)[number]) {
        setSelectedDestination(destination);
        setQuery(destination.label);
        setOpen(false);
    }

    function continueToRoute() {
        if (!selectedDestination) {
            setOpen(true);
            return;
        }

        setDestination({
            id: selectedDestination.id,
            label: selectedDestination.label,
            locationId: selectedDestination.locationId,
        });
        router.push("/rider/route");
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            setOpen(true);
            return;
        }

        if (event.key === "Escape") {
            setOpen(false);
            return;
        }

        if (!filteredDestinations.length) {
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightedIndex((current) =>
                Math.min(current + 1, filteredDestinations.length - 1),
            );
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightedIndex((current) => Math.max(current - 1, 0));
        }

        if (event.key === "Enter" && open) {
            event.preventDefault();
            chooseDestination(filteredDestinations[highlightedIndex]);
        }
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
                    <p className="text-sm font-bold tracking-wide text-rf-green">RIDEFLOW</p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight">Choose your drop-off</h1>
                    <p className="mt-2 text-sm text-rf-text-secondary">
                        Search, select, then review your route.
                    </p>

                    <div className="mt-7 rounded-2xl bg-rf-surface-muted p-4">
                        <p className="text-xs font-semibold text-rf-text-secondary">Pickup</p>
                        <div className="mt-2 flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rf-green/10 text-rf-green">
                                <MapPin size={17} />
                            </span>
                            <p className="text-sm font-semibold text-rf-text">
                                {pickup?.label ?? "Current location · Hyderabad"}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label htmlFor="destination" className="text-sm font-semibold text-rf-text">
                            Drop-off location
                        </label>

                        <div className="relative mt-2">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-rf-green"
                            />
                            <input
                                id="destination"
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setSelectedDestination(null);
                                    setHighlightedIndex(0);
                                    setOpen(true);
                                }}
                                onFocus={() => setOpen(true)}
                                onKeyDown={handleKeyDown}
                                role="combobox"
                                aria-autocomplete="list"
                                aria-controls="drop-off-options"
                                aria-expanded={open}
                                placeholder="Search a destination"
                                autoFocus
                                className="h-14 w-full rounded-2xl border border-rf-border bg-white py-3 pl-12 pr-12 text-sm outline-none transition placeholder:text-rf-text-secondary/60 focus:border-rf-green focus:ring-4 focus:ring-rf-green/10"
                            />
                            {query ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuery("");
                                        setSelectedDestination(null);
                                        setHighlightedIndex(0);
                                        setOpen(true);
                                    }}
                                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-rf-text-secondary transition hover:bg-rf-surface-muted"
                                    aria-label="Clear destination search"
                                >
                                    <X size={17} />
                                </button>
                            ) : (
                                <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-rf-text-secondary" />
                            )}

                            {open && (
                                <div
                                    id="drop-off-options"
                                    role="listbox"
                                    className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-rf-border bg-white p-2 shadow-lg"
                                >
                                    {filteredDestinations.length ? (
                                        filteredDestinations.map((destination, index) => (
                                            <button
                                                key={destination.id}
                                                type="button"
                                                role="option"
                                                aria-selected={selectedDestination?.id === destination.id}
                                                onMouseEnter={() => setHighlightedIndex(index)}
                                                onClick={() => chooseDestination(destination)}
                                                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${highlightedIndex === index ? "bg-rf-green/10" : "hover:bg-rf-surface-muted"}`}
                                            >
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rf-surface-muted text-rf-green">
                                                    <MapPin size={17} />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-sm font-semibold text-rf-text">{destination.label}</span>
                                                    <span className="mt-0.5 block truncate text-xs text-rf-text-secondary">{destination.address}</span>
                                                </span>
                                                <span className="text-xs font-medium text-rf-text-secondary">{destination.distance}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-4">
                                            <p className="text-sm font-semibold text-rf-text">No matching places</p>
                                            <p className="mt-1 text-xs text-rf-text-secondary">Try one of your saved Hyderabad destinations.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedDestination && (
                        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-rf-green/20 bg-rf-green/5 p-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rf-green text-white">
                                <MapPin size={18} />
                            </span>
                            <div>
                                <p className="text-xs font-semibold text-rf-text-secondary">Selected drop-off</p>
                                <p className="mt-1 text-sm font-bold text-rf-text">{selectedDestination.label}</p>
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={continueToRoute}
                        className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-rf-green text-sm font-semibold text-white transition hover:bg-rf-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {selectedDestination ? "Review route" : "Select a drop-off"}
                        <ArrowRight size={17} />
                    </button>
                </section>
            </div>
        </main>
    );
}
