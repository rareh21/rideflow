import { api } from "./api";
import type { PaymentMethod, RideLocation, RideStatus, RideType, RideVehicle } from "./rides";

export interface RideHistoryPayment {
    id: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
}

export interface RideHistoryReview {
    id: string;
    rating: number;
    comment: string | null;
    reviewerId: string;
    revieweeId: string;
}

export interface RideHistoryDriver {
    id: string;
    status: string;
    user: {
        id: string;
        name: string;
    };
    vehicle: RideVehicle | null;
}

export interface RideHistoryRider {
    id: string;
    name: string;
    email: string;
}

export interface RideHistoryItem {
    id: string;
    riderId: string;
    driverId: string | null;
    rideType: RideType;
    status: RideStatus;
    estimatedFare: number;
    estimatedDistanceKm: number;
    estimatedDurationMinutes: number;
    paymentMethod: PaymentMethod | null;
    pickupLocation: RideLocation;
    destinationLocation: RideLocation;
    driver: RideHistoryDriver | null;
    rider?: RideHistoryRider;
    payment: RideHistoryPayment | null;
    reviews: RideHistoryReview[];
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
}

export interface RideHistoryPaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export interface RideHistoryResponse {
    items: RideHistoryItem[];
    meta: RideHistoryPaginationMeta;
}

export interface RideHistoryFilterParams {
    page?: number;
    limit?: number;
    status?: RideStatus;
    startDate?: string;
    endDate?: string;
    search?: string;
}

/**
 * Builds query string from filter parameters.
 */
function buildQueryString(params: RideHistoryFilterParams): string {
    const searchParams = new URLSearchParams();

    if (params.page && params.page > 1) {
        searchParams.set("page", params.page.toString());
    }
    if (params.limit && params.limit !== 10) {
        searchParams.set("limit", params.limit.toString());
    }
    if (params.status) {
        searchParams.set("status", params.status);
    }
    if (params.startDate) {
        searchParams.set("startDate", params.startDate);
    }
    if (params.endDate) {
        searchParams.set("endDate", params.endDate);
    }
    if (params.search?.trim()) {
        searchParams.set("search", params.search.trim());
    }

    const qs = searchParams.toString();
    return qs ? `?${qs}` : "";
}

/**
 * Fetch rider's ride history with search, filtering, and pagination.
 */
export async function getRiderRideHistory(
    params: RideHistoryFilterParams = {},
): Promise<RideHistoryResponse> {
    const qs = buildQueryString(params);
    return api<RideHistoryResponse>(`/rides/my/history${qs}`);
}

/**
 * Fetch driver's ride history with search, filtering, and pagination.
 */
export async function getDriverRideHistory(
    params: RideHistoryFilterParams = {},
): Promise<RideHistoryResponse> {
    const qs = buildQueryString(params);
    return api<RideHistoryResponse>(`/rides/driver/my/history${qs}`);
}
