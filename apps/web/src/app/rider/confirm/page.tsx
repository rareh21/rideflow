"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/rider/route");
    }, [router]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-rf-surface-muted px-6">
            <p className="text-sm font-semibold text-rf-muted">Redirecting to route preview…</p>
        </main>
    );
}