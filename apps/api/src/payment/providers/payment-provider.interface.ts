import { PaymentMethod, PaymentStatus } from "@prisma/client";

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

export interface PaymentProvider {
    createPayment(input: PaymentProviderInput): Promise<PaymentProviderResult>;
    processPayment?(
        paymentId: string,
        simulateResult?: "success" | "failure",
    ): Promise<PaymentProviderResult>;
}
