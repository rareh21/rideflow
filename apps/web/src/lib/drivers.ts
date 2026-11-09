import { api } from "./api";

export type DriverApplicationStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

export type DriverApplication = {
    id: string;
    status: DriverApplicationStatus;
    licenseNumber: string | null;
    rejectionReason: string | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type CreateDriverApplicationPayload = {
    licenseNumber?: string;
};

export async function getDriverApplication() {
    return api<DriverApplication>(
        "/drivers/application",
    );
}

export async function createDriverApplication(
    payload: CreateDriverApplicationPayload,
) {
    return api<DriverApplication>(
        "/drivers/application",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
    );
}

export type AdminDriverApplication = DriverApplication & {
    userId: string;
    reviewedById: string | null;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        createdAt: string;
    };
};

export type ReviewDriverApplicationPayload = {
    status: "APPROVED" | "REJECTED";
    rejectionReason?: string;
};

export async function getDriverApplications() {
    return api<AdminDriverApplication[]>("/drivers/applications");
}

export async function getDriverApplicationById(id: string) {
    return api<AdminDriverApplication>(`/drivers/applications/${id}`);
}

export async function reviewDriverApplication(
    id: string,
    payload: ReviewDriverApplicationPayload,
) {
    return api<AdminDriverApplication>(`/drivers/applications/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export type DriverStatus =
    | "OFFLINE"
    | "AVAILABLE"
    | "BUSY";

export type DriverVehicle = {
    id: string;
    make: string;
    model: string;
    year: number;
    plateNumber: string;
};

export type DriverProfile = {
    id: string;
    userId: string;
    licenseNumber: string | null;
    status: DriverStatus;
    user: {
        id: string;
        name: string;
        email: string;
        role: "DRIVER";
    };
    vehicle: DriverVehicle | null;
};

export async function getMyDriver() {
    return api<DriverProfile>("/drivers/me");
}

export async function updateDriverStatus(
    status: DriverStatus,
) {
    return api<DriverProfile>("/drivers/me/status", {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}