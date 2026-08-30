import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-rf-surface-muted text-rf-midnight lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-rf-midnight p-10 lg:flex lg:min-h-screen lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-rf-green/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-rf-green/10 blur-3xl" />

        <Link href="/" className="relative z-10 w-fit text-lg font-bold tracking-[0.18em] text-rf-green">
          RIDEFLOW
        </Link>

        <div className="relative z-10 max-w-xl pb-12">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-rf-green">
            Move freely. Flow confidently.
          </p>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-white xl:text-6xl">
            Your ride.<br />Your rhythm.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/65">
            A calmer, clearer way to move through the city — with upfront pricing,
            thoughtful safety and a ride experience built around you.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3 text-xs text-white/55">
          <div><strong className="block text-sm text-white">Clear pricing</strong>Know before you go</div>
          <div><strong className="block text-sm text-white">Safety first</strong>Help when you need it</div>
          <div><strong className="block text-sm text-white">Made for cities</strong>Built around your flow</div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="text-lg font-bold tracking-[0.18em] text-rf-green-dark">RIDEFLOW</Link>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
