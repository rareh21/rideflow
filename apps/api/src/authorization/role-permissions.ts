import { UserRole } from "@prisma/client";
import { Permission, Permissions } from "./permissions";

const SHARED_PERMISSIONS: Permission[] = [
    Permissions.ACCOUNT_PROFILE_VIEW,
    Permissions.ACCOUNT_PROFILE_EDIT,
    Permissions.ACCOUNT_NOTIFICATIONS_MANAGE,
    Permissions.ACCOUNT_PRIVACY_MANAGE,
    Permissions.ACCOUNT_SECURITY_MANAGE,
    Permissions.ACCOUNT_HELP_VIEW,
    Permissions.ACCOUNT_LOGOUT,
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.RIDER]: [
        ...SHARED_PERMISSIONS,

        Permissions.RIDER_DASHBOARD_VIEW,
        Permissions.RIDER_RIDE_CREATE,
        Permissions.RIDER_RIDE_VIEW,
        Permissions.RIDER_RIDE_CANCEL,
        Permissions.RIDER_SAVED_PLACES_VIEW,
        Permissions.RIDER_SAVED_PLACES_MANAGE,
        Permissions.RIDER_PAYMENT_VIEW,
        Permissions.RIDER_PAYMENT_MANAGE,
    ],

    [UserRole.DRIVER]: [
        ...SHARED_PERMISSIONS,

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

    [UserRole.ADMIN]: [
        ...SHARED_PERMISSIONS,

        Permissions.ADMIN_DASHBOARD_VIEW,
        Permissions.ADMIN_DRIVER_APPLICATIONS_VIEW,
        Permissions.ADMIN_DRIVER_APPLICATIONS_REVIEW,
        Permissions.ADMIN_USERS_VIEW,
        Permissions.ADMIN_USERS_MANAGE,
    ],
};