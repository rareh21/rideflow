import { Injectable } from "@nestjs/common";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import {
    PaymentProvider,
    PaymentProviderInput,
    PaymentProviderResult,
} from "./payment-provider.interface";

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
    readonly providerName = "mock";

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
}
