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

export async function getDriverApplication() {
    return api<DriverApplication>(
        "/drivers/application",
    );
}