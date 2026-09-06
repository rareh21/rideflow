import { api } from "@/lib/api";
import type { User, UserRole } from "@/types/auth";

export type UserProfile = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
};

export type UpdateProfilePayload = {
    name?: string;
    email?: string;
};

export type UserPreferences = {
    id: string;
    userId: string;
    defaultPaymentMethod: "UPI" | "CARD" | "CASH";
    rideNotificationsEnabled: boolean;
    promotionalNotificationsEnabled: boolean;
    createdAt: string;
    updatedAt: string;
};

export type UpdatePreferencesPayload = Partial<
    Pick<
        UserPreferences,
        | "defaultPaymentMethod"
        | "rideNotificationsEnabled"
        | "promotionalNotificationsEnabled"
    >
>;

export function getUserProfile() {
    return api<UserProfile>("/users/me");
}

export function updateUserProfile(
    payload: UpdateProfilePayload,
) {
    return api<UserProfile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export function getUserPreferences() {
    return api<UserPreferences>("/users/me/preferences");
}

export function updateUserPreferences(
    payload: UpdatePreferencesPayload,
) {
    return api<UserPreferences>("/users/me/preferences", {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}