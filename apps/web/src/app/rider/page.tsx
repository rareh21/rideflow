"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export default function RiderPage() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-rf-surface-muted text-rf-text">
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

        {/* Main */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">

          {/* Booking */}
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">

            <div className="max-w-xl">
              <p className="text-sm font-semibold text-rf-green">
                RIDEFLOW
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Where are you going?
              </h1>

              <p className="mt-2 text-base text-rf-text-secondary">
                Your ride. Your rhythm.
              </p>
            </div>

            <div className="mt-8 space-y-3">

              {/* Pickup */}
              <div className="flex items-center gap-4 rounded-2xl bg-rf-surface-muted p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rf-green/10 text-rf-green">
                  ●
                </div>

                <div>
                  <p className="text-xs font-medium text-rf-text-secondary">
                    Pickup
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    Current location · Hyderabad
                  </p>
                </div>
              </div>

              {/* Destination */}
              <Link
                href="/rider/destination"
                className="flex items-center gap-4 rounded-2xl border border-rf-border bg-white p-4 transition hover:border-rf-green hover:shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rf-green/10 text-rf-green">
                  ⌕
                </div>

                <div>
                  <p className="text-xs font-medium text-rf-text-secondary">
                    Destination
                  </p>

                  <p className="mt-1 text-sm font-semibold text-rf-text-secondary">
                    Search destination
                  </p>
                </div>
              </Link>

              <Link
                href="/rider/destination"
                className="mt-2 flex h-14 items-center justify-center rounded-2xl bg-rf-green text-sm font-semibold text-white transition hover:bg-rf-green-dark"
              >
                Find a ride
              </Link>
            </div>

            {/* Recent */}
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">
                  Recent places
                </h2>

                <button
                  type="button"
                  className="text-xs font-semibold text-rf-green"
                >
                  View all
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  className="rounded-2xl bg-rf-surface-muted p-4 text-left transition hover:bg-rf-green/5"
                >
                  <p className="text-sm font-semibold">
                    Madhapur
                  </p>

                  <p className="mt-1 text-xs text-rf-text-secondary">
                    3.8 km away
                  </p>
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-rf-surface-muted p-4 text-left transition hover:bg-rf-green/5"
                >
                  <p className="text-sm font-semibold">
                    Jubilee Hills
                  </p>

                  <p className="mt-1 text-xs text-rf-text-secondary">
                    6.2 km away
                  </p>
                </button>

              </div>
            </div>
          </div>

          {/* Right column */}
          <aside className="space-y-6">

            {/* Map placeholder */}
            <div className="relative min-h-[320px] overflow-hidden rounded-3xl bg-rf-midnight shadow-sm">
              <div className="absolute inset-0 opacity-20">
                <div className="h-full w-full bg-[radial-gradient(circle_at_center,_var(--color-rf-green)_1px,_transparent_1px)] [background-size:24px_24px]" />
              </div>

              <div className="relative flex h-full min-h-[320px] flex-col justify-between p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-rf-green">
                    Your city
                  </p>

                  <p className="mt-2 text-xl font-bold text-white">
                    Hyderabad
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm font-semibold text-white">
                    Map coming next
                  </p>

                  <p className="mt-1 text-xs text-white/60">
                    Live route and driver location will appear here.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold">
                Quick access
              </h2>

              <div className="mt-4 space-y-2">

                <Link
                  href="/rider/rides"
                  className="flex items-center justify-between rounded-2xl bg-rf-surface-muted p-4 transition hover:bg-rf-green/5"
                >
                  <span className="text-sm font-semibold">
                    Your rides
                  </span>

                  <span className="text-rf-green">
                    →
                  </span>
                </Link>

                <Link
                  href="/rider/saved-places"
                  className="flex items-center justify-between rounded-2xl bg-rf-surface-muted p-4 transition hover:bg-rf-green/5"
                >
                  <span className="text-sm font-semibold">
                    Saved places
                  </span>

                  <span className="text-rf-green">
                    →
                  </span>
                </Link>

                <Link
                  href="/rider/safety"
                  className="flex items-center justify-between rounded-2xl bg-rf-surface-muted p-4 transition hover:bg-rf-green/5"
                >
                  <span className="text-sm font-semibold">
                    Safety centre
                  </span>

                  <span className="text-rf-green">
                    →
                  </span>
                </Link>

              </div>
            </div>

          </aside>
        </section>

        {/* Trust strip */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">

          <TrustItem
            title="Trusted rides"
            description="Clear pricing before you book."
          />

          <TrustItem
            title="Safety first"
            description="Help whenever you need it."
          />

          <TrustItem
            title="Made for cities"
            description="Built around your flow."
          />

        </section>
      </div>
    </main>
  );
}

function TrustItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-rf-midnight p-5">
      <p className="text-sm font-semibold text-rf-green">
        {title}
      </p>

      <p className="mt-1 text-xs text-white/60">
        {description}
      </p>
    </div>
  );
}