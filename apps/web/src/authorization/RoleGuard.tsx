"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

type Role =
    | "RIDER"
    | "DRIVER"
    | "ADMIN";

interface RoleGuardProps {
    allowedRoles: Role[];
    children: React.ReactNode;
}

export function RoleGuard({
    allowedRoles,
    children,
}: RoleGuardProps) {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (!allowedRoles.includes(user.role as Role)) {
            switch (user.role) {
                case "DRIVER":
                    router.replace("/driver");
                    break;
                case "ADMIN":
                    router.replace("/admin");
                    break;
                default:
                    router.replace("/rider");
            }
        }
    }, [
        allowedRoles,
        loading,
        router,
        user,
    ]);

    if (loading || !user) {
        return null;
    }

    if (
        !allowedRoles.includes(user.role as Role)
    ) {
        return null;
    }

    return <>{children}</>;
}