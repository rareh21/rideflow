"use client";

import { useBooking } from "@/context/booking-context";

export default function FindingDriverPage() {
    const {
        destination,
        selectedRide,
    } = useBooking();

    return (
        <main className="flex min-h-screen items-center justify-center bg-rf-midnight px-6">
            <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rf-green/10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-rf-green/20 border-t-rf-green" />
                </div>

                <p className="mt-8 text-sm font-bold tracking-wide text-rf-green">
                    RIDEFLOW
                </p>

                <h1 className="mt-3 text-2xl font-bold">
                    Finding your ride
                </h1>

                <p className="mt-2 text-sm text-rf-text-secondary">
                    We're matching you with the right driver.
                </p>

                <div className="mt-8 rounded-2xl bg-rf-surface-muted p-5 text-left">

                    <div className="flex justify-between">
                        <span className="text-xs text-rf-text-secondary">
                            Destination
                        </span>

                        <span className="text-sm font-semibold">
                            {destination?.label}
                        </span>
                    </div>

                    <div className="mt-4 flex justify-between">
                        <span className="text-xs text-rf-text-secondary">
                            Ride
                        </span>

                        <span className="text-sm font-semibold">
                            {selectedRide?.name}
                        </span>
                    </div>

                    <div className="mt-4 flex justify-between">
                        <span className="text-xs text-rf-text-secondary">
                            Estimated fare
                        </span>

                        <span className="text-sm font-semibold">
                            ₹{selectedRide?.fare}
                        </span>
                    </div>

                </div>

                <p className="mt-6 text-xs text-rf-text-secondary">
                    Driver matching will be connected to the Ride API next.
                </p>

            </section>
        </main>
    );
}