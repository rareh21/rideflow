import { Permission, Permissions } from "@/authorization/permissions";

export type NavigationItem = {
    label: string;
    href: string;
    permission: Permission;
};

export const RIDER_NAVIGATION: NavigationItem[] = [
    {
        label: "Home",
        href: "/rider",
        permission: Permissions.RIDER_DASHBOARD_VIEW,
    },
    {
        label: "My Rides",
        href: "/rider/rides",
        permission: Permissions.RIDER_RIDE_VIEW,
    },
    {
        label: "Saved Places",
        href: "/profile/saved-places",
        permission:
            Permissions.RIDER_SAVED_PLACES_VIEW,
    },
    {
        label: "Payments",
        href: "/profile/payment-settings",
        permission:
            Permissions.RIDER_PAYMENT_VIEW,
    },
    {
        label: "Profile",
        href: "/profile",
        permission:
            Permissions.ACCOUNT_PROFILE_VIEW,
    },
];

export const DRIVER_NAVIGATION: NavigationItem[] = [
    {
        label: "Dashboard",
        href: "/driver",
        permission:
            Permissions.DRIVER_DASHBOARD_VIEW,
    },
    {
        label: "Rides",
        href: "/driver/rides",
        permission:
            Permissions.DRIVER_RIDE_VIEW,
    },
    {
        label: "Availability",
        href: "/driver/availability",
        permission:
            Permissions.DRIVER_AVAILABILITY_VIEW,
    },
    {
        label: "Vehicle",
        href: "/driver/vehicle",
        permission:
            Permissions.DRIVER_VEHICLE_VIEW,
    },
    {
        label: "Earnings",
        href: "/driver/earnings",
        permission:
            Permissions.DRIVER_EARNINGS_VIEW,
    },
    {
        label: "Profile",
        href: "/driver/profile",
        permission:
            Permissions.DRIVER_PROFILE_VIEW,
    },
];

export const ADMIN_NAVIGATION: NavigationItem[] = [
    {
        label: "Dashboard",
        href: "/admin",
        permission:
            Permissions.ADMIN_DASHBOARD_VIEW,
    },
    {
        label: "Driver Applications",
        href: "/admin/driver-applications",
        permission:
            Permissions.ADMIN_DRIVER_APPLICATIONS_VIEW,
    },
    {
        label: "Users",
        href: "/admin/users",
        permission:
            Permissions.ADMIN_USERS_VIEW,
    },
];