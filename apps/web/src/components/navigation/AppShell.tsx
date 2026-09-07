"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";
import { useAuthorization } from "@/components/auth/authorization-context";
import { NAVIGATION_BY_ROLE } from "@/config/navigation";

import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

const PUBLIC_ROUTES = ["/login", "/register"];

export function AppShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const { user, loading } = useAuth();
    const { hasPermission } = useAuthorization();

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    useEffect(() => {
        if (!loading && !user && !isPublicRoute) {
            router.replace("/login");
        }
    }, [
        loading,
        user,
        isPublicRoute,
        router,
    ]);

    if (isPublicRoute) {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--rf-surface-muted)]">
                <div className="text-sm text-[var(--rf-muted)]">
                    Loading RideFlow...
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const navigation =
        NAVIGATION_BY_ROLE[user.role];

    const visibleNavigation =
        navigation.filter((item) =>
            hasPermission(item.permission)
        );

    return (
        <div className="min-h-screen bg-[var(--rf-surface-muted)]">
            <AppHeader />

            <div className="flex min-h-[calc(100vh-4rem)]">
                <AppSidebar
                    items={visibleNavigation}
                    pathname={pathname}
                />

                <main
                    className="
                        min-w-0
                        flex-1
                        overflow-x-hidden
                        pb-24
                        lg:pb-0
                    "
                >
                    {children}
                </main>
            </div>

            <MobileBottomNav
                items={visibleNavigation}
                pathname={pathname}
            />
        </div>
    );
}