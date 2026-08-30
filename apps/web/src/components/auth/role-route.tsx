"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import type { UserRole } from "@/types/auth";

type RoleRouteProps = {
    allowedRoles: UserRole[];
    children: React.ReactNode;
};

function getRoleHome(role: UserRole) {
    switch (role) {
        case "RIDER":
            return "/rider";

        case "DRIVER":
            return "/driver";

        case "ADMIN":
            return "/admin";

        default:
            return "/login";
    }
}

export function RoleRoute({
    allowedRoles,
    children,
}: RoleRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.replace("/login");
            return;
        }

        if (!allowedRoles.includes(user.role)) {
            router.replace(getRoleHome(user.role));
        }
    }, [allowedRoles, loading, user, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-rf-surface-muted">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-rf-green/20 border-t-rf-green" />

                    <p className="text-sm font-medium text-rf-text-secondary">
                        Checking your access...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (!allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}