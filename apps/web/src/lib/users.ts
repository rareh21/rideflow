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

export type SavedPlace = {
    id: string;
    userId: string;
    label: string;
    address: string;
    latitude: number;
    longitude: number;
    createdAt: string;
    updatedAt: string;
};

export type CreateSavedPlaceInput = {
    label: string;
    address: string;
    latitude: number;
    longitude: number;
};

export async function getSavedPlaces() {
    return api<SavedPlace[]>("/users/me/saved-places");
}

export async function createSavedPlace(
    data: CreateSavedPlaceInput,
) {
    return api<SavedPlace>("/users/me/saved-places", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateSavedPlace(
    id: string,
    data: Partial<CreateSavedPlaceInput>,
) {
    return api<SavedPlace>(
        `/users/me/saved-places/${id}`,
        {
            method: "PATCH",
            body: JSON.stringify(data),
        },
    );
}

export async function deleteSavedPlace(id: string) {
    return api<{ success: boolean }>(
        `/users/me/saved-places/${id}`,
        {
            method: "DELETE",
        },
    );
}

export async function changePassword(data: {
    currentPassword: string;
    newPassword: string;
}) {
    return api<{ success: boolean }>(
        "/users/me/security/password",
        {
            method: "PATCH",
            body: JSON.stringify(data),
        },
    );
}