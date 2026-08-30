export function AuthHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-rf-green-dark">Welcome to RideFlow</p>
      <h2 className="text-3xl font-bold tracking-[-0.03em] text-rf-midnight">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-rf-muted">{description}</p>
    </div>
  );
}
