import { api } from "./api";

export type Vehicle = {
    id: string;
    driverId: string;
    make: string;
    model: string;
    year: number;
    plateNumber: string;
};

export type CreateVehiclePayload = {
    make: string;
    model: string;
    year: number;
    plateNumber: string;
};

export type UpdateVehiclePayload =
    Partial<CreateVehiclePayload>;

export async function createVehicle(
    payload: CreateVehiclePayload,
) {
    return api<Vehicle>("/vehicles", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getMyVehicle() {
    return api<Vehicle>("/vehicles/me");
}

export async function updateMyVehicle(
    payload: UpdateVehiclePayload,
) {
    return api<Vehicle>("/vehicles/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}