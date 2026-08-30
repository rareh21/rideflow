export default function AdminPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-rf-surface-muted">
      <div className="rounded-3xl bg-rf-midnight p-10 text-center text-white shadow-lg">
        <p className="text-sm font-bold text-rf-green">
          RIDEFLOW
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-white/70">
          ADMIN access confirmed.
        </p>
      </div>
    </main>
  );
}