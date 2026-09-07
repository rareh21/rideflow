"use client";

import { useAuthorization } from "@/components/auth/authorization-context";
import { Permission } from "@/authorization/permissions";


interface CanProps {
    permission: Permission;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function Can({
    permission,
    children,
    fallback = null,
}: CanProps) {
    const { hasPermission } =
        useAuthorization();

    if (!hasPermission(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}