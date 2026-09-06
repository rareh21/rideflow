export function ProfileSkeleton() {
    return (
        <main className="min-h-screen bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6">
                {/* Header skeleton */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-4 w-16 animate-pulse rounded bg-[var(--rf-border)]" />
                        <div className="h-7 w-28 animate-pulse rounded-lg bg-[var(--rf-border)]" />
                    </div>

                    <div className="h-11 w-11 animate-pulse rounded-full bg-[var(--rf-border)]" />
                </div>

                {/* Profile card skeleton */}
                <div
                    className="
            animate-pulse
            rounded-[2rem]
            bg-[var(--rf-midnight)]
            p-6
          "
                >
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-2xl bg-white/10" />

                        <div className="flex-1 space-y-3">
                            <div className="h-5 w-36 rounded bg-white/10" />
                            <div className="h-4 w-48 rounded bg-white/10" />
                            <div className="h-6 w-16 rounded-full bg-white/10" />
                        </div>
                    </div>

                    <div className="mt-6 h-3 w-40 rounded bg-white/10" />
                </div>

                {/* Sections */}
                <div className="mt-8 space-y-6">
                    {[1, 2, 3, 4].map((section) => (
                        <div key={section} className="space-y-3">
                            <div className="h-3 w-20 animate-pulse rounded bg-[var(--rf-border)]" />

                            <div
                                className="
                  overflow-hidden
                  rounded-3xl
                  border border-[var(--rf-border)]
                  bg-[var(--rf-surface)]
                "
                            >
                                {[1, 2].map((item) => (
                                    <div
                                        key={item}
                                        className="
                      flex min-h-[76px]
                      items-center gap-4
                      px-4 py-3
                    "
                                    >
                                        <div className="h-11 w-11 animate-pulse rounded-xl bg-[var(--rf-surface-muted)]" />

                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-36 animate-pulse rounded bg-[var(--rf-border)]" />
                                            <div className="h-3 w-52 animate-pulse rounded bg-[var(--rf-border)]" />
                                        </div>

                                        <div className="h-5 w-5 animate-pulse rounded bg-[var(--rf-border)]" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Logout skeleton */}
                    <div className="h-14 animate-pulse rounded-2xl bg-[var(--rf-border)]" />
                </div>
            </div>
        </main>
    );
}