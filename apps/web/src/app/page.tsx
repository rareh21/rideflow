import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-rf-midnight text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <span className="text-lg font-bold tracking-[0.18em] text-rf-green">RIDEFLOW</span>
          <div className="flex gap-3">
            <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10">Sign in</Link>
            <Link href="/register" className="rounded-xl bg-rf-green px-4 py-2 text-sm font-semibold text-rf-midnight hover:bg-rf-green-dark">Create account</Link>
          </div>
        </nav>
        <section className="flex flex-1 items-center py-20">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-rf-green">Move freely. Flow confidently.</p>
            <h1 className="text-5xl font-bold tracking-[-0.05em] sm:text-7xl">Your ride.<br />Your rhythm.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">Clear pricing, thoughtful safety and a calmer way to move through the city.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
