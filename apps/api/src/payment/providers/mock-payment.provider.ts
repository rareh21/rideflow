import { Injectable } from "@nestjs/common";
import { PaymentMethod, PaymentStatus, RefundStatus } from "@prisma/client";
import {
    PaymentProvider,
    PaymentProviderInput,
    PaymentProviderResult,
    RefundProviderInput,
    RefundProviderResult,
} from "./payment-provider.interface";

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
    readonly providerName = "mock";

    // In-memory idempotency store to simulate provider-side stable idempotency keys
    private readonly idempotencyStore = new Map<string, RefundProviderResult>();

    async createPayment(
        input: PaymentProviderInput,
    ): Promise<PaymentProviderResult> {
        if (input.method === PaymentMethod.CASH) {
            throw new Error("CASH payments must not invoke digital payment provider.");
        }

        const providerPaymentId = `mock_pay_${input.paymentId.replace(/-/g, "").slice(0, 12)}`;

        return {
            provider: this.providerName,
            providerPaymentId,
            status: PaymentStatus.SUCCEEDED,
        };
    }

    async processPayment(
        paymentId: string,
        simulateResult?: "success" | "failure",
    ): Promise<PaymentProviderResult> {
        const providerPaymentId = `mock_pay_${paymentId.replace(/-/g, "").slice(0, 12)}`;

        if (simulateResult === "failure") {
            return {
                provider: this.providerName,
                providerPaymentId,
                status: PaymentStatus.FAILED,
                failureReason: "Payment could not be completed. Please try again.",
            };
        }

        return {
            provider: this.providerName,
            providerPaymentId,
            status: PaymentStatus.SUCCEEDED,
        };
    }

    async getPaymentStatus(
        providerPaymentId: string,
    ): Promise<PaymentProviderResult> {
        // Mock reconciliation: returns current status for the provider payment
        return {
            provider: this.providerName,
            providerPaymentId,
            status: PaymentStatus.SUCCEEDED,
        };
    }

    async refundPayment(
        input: RefundProviderInput,
    ): Promise<RefundProviderResult> {
        // Check provider idempotency store
        const existing = this.idempotencyStore.get(input.idempotencyKey);
        if (existing) {
            return existing;
        }

        const providerRefundId = `mock_ref_${input.refundId.replace(/-/g, "").slice(0, 12)}`;

        const result: RefundProviderResult = {
            provider: this.providerName,
            providerRefundId,
            status: RefundStatus.SUCCEEDED,
        };

        this.idempotencyStore.set(input.idempotencyKey, result);
        return result;
    }
}
