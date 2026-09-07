"use client";

import {
    createContext,
    useContext,
    useMemo,
} from "react";
import { useAuth } from "@/context/auth-context";
import {
    Permission,
    Permissions,
} from "../../authorization/permissions";

type AuthorizationContextValue = {
    permissions: Permission[];
    hasPermission: (
        permission: Permission,
    ) => boolean;
    hasAnyPermission: (
        permissions: Permission[],
    ) => boolean;
    hasAllPermissions: (
        permissions: Permission[],
    ) => boolean;
};

const AuthorizationContext =
    createContext<AuthorizationContextValue | null>(
        null,
    );

const SHARED: Permission[] = [
    Permissions.ACCOUNT_PROFILE_VIEW,
    Permissions.ACCOUNT_PROFILE_EDIT,
    Permissions.ACCOUNT_NOTIFICATIONS_MANAGE,
    Permissions.ACCOUNT_PRIVACY_MANAGE,
    Permissions.ACCOUNT_SECURITY_MANAGE,
    Permissions.ACCOUNT_HELP_VIEW,
    Permissions.ACCOUNT_LOGOUT,
];

const ROLE_PERMISSIONS: Record<
    string,
    Permission[]
> = {
    RIDER: [
        ...SHARED,
        Permissions.RIDER_DASHBOARD_VIEW,
        Permissions.RIDER_RIDE_CREATE,
        Permissions.RIDER_RIDE_VIEW,
        Permissions.RIDER_RIDE_CANCEL,
        Permissions.RIDER_SAVED_PLACES_VIEW,
        Permissions.RIDER_SAVED_PLACES_MANAGE,
        Permissions.RIDER_PAYMENT_VIEW,
        Permissions.RIDER_PAYMENT_MANAGE,
        Permissions.DRIVER_APPLICATION_CREATE
    ],

    DRIVER: [
        ...SHARED,
        Permissions.DRIVER_DASHBOARD_VIEW,
        Permissions.DRIVER_RIDE_VIEW,
        Permissions.DRIVER_RIDE_ACCEPT,
        Permissions.DRIVER_RIDE_START,
        Permissions.DRIVER_RIDE_COMPLETE,
        Permissions.DRIVER_AVAILABILITY_VIEW,
        Permissions.DRIVER_AVAILABILITY_MANAGE,
        Permissions.DRIVER_VEHICLE_VIEW,
        Permissions.DRIVER_VEHICLE_MANAGE,
        Permissions.DRIVER_PROFILE_VIEW,
        Permissions.DRIVER_PROFILE_EDIT,
        Permissions.DRIVER_EARNINGS_VIEW,
    ],

    ADMIN: [
        ...SHARED,
        Permissions.ADMIN_DASHBOARD_VIEW,
        Permissions.ADMIN_DRIVER_APPLICATIONS_VIEW,
        Permissions.ADMIN_DRIVER_APPLICATIONS_REVIEW,
        Permissions.ADMIN_USERS_VIEW,
        Permissions.ADMIN_USERS_MANAGE,
    ],
};

export function AuthorizationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();

    const permissions = useMemo(
        () =>
            user?.role
                ? ROLE_PERMISSIONS[user.role] ?? []
                : [],
        [user?.role],
    );

    const value = useMemo(() => {
        const hasPermission = (
            permission: Permission,
        ) => permissions.includes(permission);

        return {
            permissions,
            hasPermission,
            hasAnyPermission: (
                required: Permission[],
            ) =>
                required.some((permission) =>
                    permissions.includes(permission),
                ),
            hasAllPermissions: (
                required: Permission[],
            ) =>
                required.every((permission) =>
                    permissions.includes(permission),
                ),
        };
    }, [permissions]);

    return (
        <AuthorizationContext.Provider value={value}>
            {children}
        </AuthorizationContext.Provider>
    );
}

export function useAuthorization() {
    const context = useContext(
        AuthorizationContext,
    );

    if (!context) {
        throw new Error(
            "useAuthorization must be used inside AuthorizationProvider",
        );
    }

    return context;
}