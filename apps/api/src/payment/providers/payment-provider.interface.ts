import { PaymentMethod, PaymentStatus, RefundStatus } from "@prisma/client";

export interface PaymentProviderInput {
    paymentId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
}

export interface PaymentProviderResult {
    provider: string;
    providerPaymentId: string;
    status: PaymentStatus;
    failureReason?: string;
}

export interface RefundProviderInput {
    refundId: string;
    paymentId: string;
    providerPaymentId: string | null;
    amount: number;
    currency: string;
    idempotencyKey: string;
    reason?: string | null;
}

export interface RefundProviderResult {
    provider: string;
    providerRefundId: string;
    status: RefundStatus;
    failureReason?: string;
}

export interface PaymentProvider {
    readonly providerName: string;
    createPayment(input: PaymentProviderInput): Promise<PaymentProviderResult>;
    processPayment(
        paymentId: string,
        simulateResult?: "success" | "failure",
    ): Promise<PaymentProviderResult>;
    getPaymentStatus?(
        providerPaymentId: string,
    ): Promise<PaymentProviderResult>;
    refundPayment(
        input: RefundProviderInput,
    ): Promise<RefundProviderResult>;
}
