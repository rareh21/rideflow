"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

type ProtectedRouteProps = {
    children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [loading, user, router]);

    // Prevent protected content from flashing
    // while authentication is being checked.
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-rf-surface-muted">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-rf-green/20 border-t-rf-green" />

                    <p className="text-sm font-medium text-rf-text-secondary">
                        Checking your session...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}