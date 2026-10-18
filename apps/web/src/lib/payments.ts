import { api } from "./api";
import type { PaymentMethod } from "./rides";

export type PaymentStatus =
    | "PENDING"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELLED";

export type Payment = {
    id: string;
    rideId: string;
    userId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
    provider?: string | null;
    failureReason?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type RefundStatus =
    | "PENDING"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED";

export type Refund = {
    id: string;
    rideId: string;
    paymentId: string;
    userId: string;
    amount: number;
    currency: string;
    status: RefundStatus;
    reason?: string | null;
    failureReason?: string | null;
    createdAt: string;
    updatedAt: string;
    completedAt?: string | null;
};

export type ProcessPaymentPayload = {
    simulateResult?: "success" | "failure";
};

/**
 * Creates or retrieves the canonical Payment record for a ride.
 * Amount is ALWAYS derived server-side from ride.estimatedFare.
 */
export async function createRidePayment(rideId: string): Promise<Payment> {
    return api<Payment>(`/payments/ride/${rideId}`, {
        method: "POST",
    });
}

/**
 * Retrieves sanitized payment details for a specific ride.
 */
export async function getRidePayment(rideId: string): Promise<Payment> {
    return api<Payment>(`/payments/ride/${rideId}`);
}

/**
 * Retrieves payment details by payment ID.
 */
export async function getPayment(paymentId: string): Promise<Payment> {
    return api<Payment>(`/payments/${paymentId}`);
}

/**
 * Retrieves all payments for the authenticated rider.
 */
export async function getMyPayments(): Promise<Payment[]> {
    return api<Payment[]>("/payments/me");
}

/**
 * Retries or processes a pending/failed payment via provider.
 */
export async function processPayment(
    paymentId: string,
    payload?: ProcessPaymentPayload,
): Promise<Payment> {
    return api<Payment>(`/payments/${paymentId}/process`, {
        method: "POST",
        body: payload ? JSON.stringify(payload) : undefined,
    });
}

/**
 * Retrieves sanitized refund details for a specific ride.
 */
export async function getRideRefund(rideId: string): Promise<Refund | null> {
    try {
        return await api<Refund>(`/rides/${rideId}/refund`);
    } catch {
        return null;
    }
}

/**
 * Retrieves sanitized refund details by payment ID.
 */
export async function getPaymentRefund(paymentId: string): Promise<Refund | null> {
    try {
        return await api<Refund>(`/payments/${paymentId}/refund`);
    } catch {
        return null;
    }
}
