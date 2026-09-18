import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { MockPaymentProvider } from "./providers/mock-payment.provider";
import { isValidPaymentTransition } from "./payment-status";

export type SanitizedPayment = {
    id: string;
    rideId: string;
    userId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
    provider?: string | null;
    failureReason?: string | null;
    createdAt: Date;
    updatedAt: Date;
};

@Injectable()
export class PaymentService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paymentProvider: MockPaymentProvider,
    ) { }

    /**
     * Creates or returns an existing Payment record for a specific ride.
     * Amount is ALWAYS derived strictly from ride.estimatedFare (server-authoritative).
     * Client amounts are NEVER accepted or trusted.
     * Idempotent: If a Payment already exists for rideId, returns existing payment.
     */
    async createPaymentForRide(
        rideId: string,
        authenticatedUserId: string,
    ): Promise<SanitizedPayment> {
        const ride = await this.prisma.ride.findUnique({
            where: { id: rideId },
        });

        if (!ride) {
            throw new NotFoundException("Ride not found");
        }

        if (ride.riderId !== authenticatedUserId) {
            throw new ForbiddenException("You can only create a payment for your own ride");
        }

        // Idempotency check: if payment already exists for this ride, return it.
        const existingPayment = await this.prisma.payment.findUnique({
            where: { rideId },
        });

        if (existingPayment) {
            return this.sanitizePayment(existingPayment);
        }

        const method = ride.paymentMethod ?? PaymentMethod.UPI;
        const amount = Number(ride.estimatedFare);

        if (!amount || amount <= 0) {
            throw new BadRequestException("Ride does not have a valid estimated fare");
        }

        // 1. Handle CASH payments (no digital provider call)
        if (method === PaymentMethod.CASH) {
            const cashPayment = await this.prisma.payment.create({
                data: {
                    rideId: ride.id,
                    userId: authenticatedUserId,
                    amount: ride.estimatedFare,
                    currency: "INR",
                    method: PaymentMethod.CASH,
                    status: PaymentStatus.PENDING,
                    provider: null,
                    providerPaymentId: null,
                },
            });

            return this.sanitizePayment(cashPayment);
        }

        // 2. Handle Digital Payments (UPI / CARD via provider abstraction)
        const initialPayment = await this.prisma.payment.create({
            data: {
                rideId: ride.id,
                userId: authenticatedUserId,
                amount: ride.estimatedFare,
                currency: "INR",
                method,
                status: PaymentStatus.PENDING,
                provider: "mock",
            },
        });

        try {
            const providerResult = await this.paymentProvider.createPayment({
                paymentId: initialPayment.id,
                amount,
                currency: "INR",
                method,
            });

            const updatedPayment = await this.prisma.payment.update({
                where: { id: initialPayment.id },
                data: {
                    provider: providerResult.provider,
                    providerPaymentId: providerResult.providerPaymentId,
                    status: providerResult.status,
                    failureReason: providerResult.failureReason ?? null,
                },
            });

            return this.sanitizePayment(updatedPayment);
        } catch (err) {
            const failedPayment = await this.prisma.payment.update({
                where: { id: initialPayment.id },
                data: {
                    status: PaymentStatus.FAILED,
                    failureReason: err instanceof Error ? err.message : "Payment processing failed.",
                },
            });

            return this.sanitizePayment(failedPayment);
        }
    }

    /**
     * Retrieves sanitized payment details for a ride.
     * Ensures only the owning rider (or assigned driver) can view.
     * Sensitive provider fields (secrets/keys/tokens) are NEVER exposed.
     */
    async getPaymentForRide(
        rideId: string,
        authenticatedUserId: string,
    ): Promise<SanitizedPayment> {
        const payment = await this.prisma.payment.findUnique({
            where: { rideId },
            include: {
                ride: {
                    include: {
                        driver: true,
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException("Payment not found for this ride");
        }

        const isRider = payment.userId === authenticatedUserId;
        const isDriver = payment.ride?.driver?.userId === authenticatedUserId;

        if (!isRider && !isDriver) {
            throw new ForbiddenException("You are not authorized to view this payment");
        }

        return this.sanitizePayment(payment);
    }

    /**
     * Retrieves payment by payment ID. Protected by user ownership.
     */
    async getPaymentById(
        paymentId: string,
        authenticatedUserId: string,
    ): Promise<SanitizedPayment> {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!payment) {
            throw new NotFoundException("Payment not found");
        }

        if (payment.userId !== authenticatedUserId) {
            throw new ForbiddenException("You are not authorized to view this payment");
        }

        return this.sanitizePayment(payment);
    }

    /**
     * Retrieves all payments for the authenticated rider.
     */
    async getMyPayments(
        authenticatedUserId: string,
    ): Promise<SanitizedPayment[]> {
        const payments = await this.prisma.payment.findMany({
            where: { userId: authenticatedUserId },
            orderBy: { createdAt: "desc" },
        });

        return payments.map((p) => this.sanitizePayment(p));
    }

    /**
     * Processes or retries a payment deterministically via payment provider.
     */
    async processPayment(
        paymentId: string,
        authenticatedUserId: string,
        simulateResult?: "success" | "failure",
    ): Promise<SanitizedPayment> {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!payment) {
            throw new NotFoundException("Payment not found");
        }

        if (payment.userId !== authenticatedUserId) {
            throw new ForbiddenException("You are not authorized to modify this payment");
        }

        if (payment.method === PaymentMethod.CASH) {
            throw new BadRequestException("CASH payments cannot be processed online");
        }

        if (payment.status === PaymentStatus.SUCCEEDED) {
            return this.sanitizePayment(payment);
        }

        if (!isValidPaymentTransition(payment.status, PaymentStatus.PROCESSING)) {
            throw new BadRequestException(`Cannot process payment in ${payment.status} status`);
        }

        // Set to PROCESSING
        await this.prisma.payment.update({
            where: { id: paymentId },
            data: { status: PaymentStatus.PROCESSING },
        });

        const providerResult = await this.paymentProvider.processPayment(
            paymentId,
            simulateResult,
        );

        if (!isValidPaymentTransition(PaymentStatus.PROCESSING, providerResult.status)) {
            throw new BadRequestException(`Invalid status transition to ${providerResult.status}`);
        }

        const updated = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: providerResult.status,
                providerPaymentId: providerResult.providerPaymentId,
                failureReason: providerResult.failureReason ?? null,
            },
        });

        return this.sanitizePayment(updated);
    }

    private sanitizePayment(payment: {
        id: string;
        rideId: string;
        userId: string;
        amount: unknown;
        currency: string;
        method: PaymentMethod;
        status: PaymentStatus;
        provider?: string | null;
        failureReason?: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): SanitizedPayment {
        return {
            id: payment.id,
            rideId: payment.rideId,
            userId: payment.userId,
            amount: Number(payment.amount),
            currency: payment.currency,
            method: payment.method,
            status: payment.status,
            provider: payment.provider ?? null,
            failureReason: payment.failureReason ?? null,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
        };
    }
}
