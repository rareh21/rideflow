import {
    Permission,
    Permissions,
} from "@/authorization/permissions";
import {
    Car,
    CreditCard,
    LayoutDashboard,
    MapPin,
    ShieldCheck,
    UserRound,
    Users,
    Wallet,
} from "lucide-react";

export type NavigationItem = {
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    permission: Permission;
    mobile?: boolean;
};

export const RIDER_NAVIGATION: NavigationItem[] = [
    {
        label: "Home",
        href: "/rider",
        icon: LayoutDashboard,
        permission:
            Permissions.RIDER_DASHBOARD_VIEW,
    },
    {
        label: "My Rides",
        href: "/rider/rides",
        icon: Car,
        permission:
            Permissions.RIDER_RIDE_VIEW,
    },
    {
        label: "Saved Places",
        href: "/profile/saved-places",
        icon: MapPin,
        permission:
            Permissions.RIDER_SAVED_PLACES_VIEW,
    },
    {
        label: "Payments",
        href: "/profile/payment-settings",
        icon: CreditCard,
        permission:
            Permissions.RIDER_PAYMENT_VIEW,
    },
    {
        label: "Profile",
        href: "/profile",
        icon: UserRound,
        permission:
            Permissions.ACCOUNT_PROFILE_VIEW,
    },
];

export const DRIVER_NAVIGATION: NavigationItem[] = [
    {
        label: "Dashboard",
        href: "/driver",
        icon: LayoutDashboard,
        permission:
            Permissions.DRIVER_DASHBOARD_VIEW,
        mobile: true
    },
    {
        label: "Rides",
        href: "/driver/rides",
        icon: Car,
        permission:
            Permissions.DRIVER_RIDE_VIEW,
        mobile: true
    },
    {
        label: "Availability",
        href: "/driver/availability",
        icon: ShieldCheck,
        permission:
            Permissions.DRIVER_AVAILABILITY_VIEW,
        mobile: true
    },
    {
        label: "Vehicle",
        href: "/driver/vehicle",
        icon: Car,
        permission:
            Permissions.DRIVER_VEHICLE_VIEW,
        mobile: true
    },
    {
        label: "Earnings",
        href: "/driver/earnings",
        icon: Wallet,
        permission:
            Permissions.DRIVER_EARNINGS_VIEW,
        mobile: true
    },
    {
        label: "Profile",
        href: "/profile",
        icon: UserRound,
        permission:
            Permissions.ACCOUNT_PROFILE_VIEW,
        mobile: true
    },
];

export const ADMIN_NAVIGATION: NavigationItem[] = [
    {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        permission:
            Permissions.ADMIN_DASHBOARD_VIEW,
    },
    {
        label: "Driver Applications",
        href: "/admin/driver-applications",
        icon: ShieldCheck,
        permission:
            Permissions.ADMIN_DRIVER_APPLICATIONS_VIEW,
    },
    {
        label: "Users",
        href: "/admin/users",
        icon: Users,
        permission:
            Permissions.ADMIN_USERS_VIEW,
    },
    {
        label: "Profile",
        href: "/profile",
        icon: UserRound,
        permission:
            Permissions.ACCOUNT_PROFILE_VIEW,
    },
];

export const NAVIGATION_BY_ROLE = {
    RIDER: RIDER_NAVIGATION,
    DRIVER: DRIVER_NAVIGATION,
    ADMIN: ADMIN_NAVIGATION,
} as const;