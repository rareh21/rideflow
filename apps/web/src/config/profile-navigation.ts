import {
    Bell,
    CreditCard,
    HelpCircle,
    Lock,
    MapPin,
    Shield,
    UserRound,
} from "lucide-react";

import {
    Permissions,
    Permission,
} from "@/authorization/permissions";

export type ProfileNavigationItem = {
    href: string;
    icon: typeof UserRound;
    title: string;
    description: string;
    permission: Permission;
};

export type ProfileNavigationSection = {
    title: string;
    items: ProfileNavigationItem[];
};

export const PROFILE_NAVIGATION: ProfileNavigationSection[] = [
    {
        title: "Personal",
        items: [
            {
                href: "/profile/edit",
                icon: UserRound,
                title: "Personal information",
                description:
                    "Manage your name and account details",
                permission:
                    Permissions.ACCOUNT_PROFILE_EDIT,
            },
            {
                href: "/profile/saved-places",
                icon: MapPin,
                title: "Saved places",
                description:
                    "Home, work and favorite locations",
                permission:
                    Permissions.RIDER_SAVED_PLACES_VIEW,
            },
        ],
    },

    {
        title: "Payments",
        items: [
            {
                href: "/profile/payment-settings",
                icon: CreditCard,
                title: "Payment settings",
                description:
                    "Manage your preferred payment method",
                permission:
                    Permissions.RIDER_PAYMENT_VIEW,
            },
        ],
    },

    {
        title: "Preferences",
        items: [
            {
                href: "/profile/preferences",
                icon: Bell,
                title: "Notifications",
                description:
                    "Manage your RideFlow notifications",
                permission:
                    Permissions.ACCOUNT_NOTIFICATIONS_MANAGE,
            },
            {
                href: "/profile/privacy",
                icon: Shield,
                title: "Privacy",
                description:
                    "Manage privacy preferences",
                permission:
                    Permissions.ACCOUNT_PRIVACY_MANAGE
            },
            {
                href: "/profile/security",
                icon: Lock,
                title: "Security",
                description:
                    "Manage account security",
                permission:
                    Permissions.ACCOUNT_SECURITY_MANAGE,
            },
        ],
    },

    {
        title: "Support",
        items: [
            {
                href: "/profile/help-support",
                icon: HelpCircle,
                title: "Help & support",
                description:
                    "Get help with RideFlow",
                permission:
                    Permissions.ACCOUNT_HELP_VIEW,
            },
        ],
    },
];