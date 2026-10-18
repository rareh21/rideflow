import {
    ForbiddenException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common";
import {
    PaymentMethod,
    PaymentStatus,
    Prisma,
    RefundJobStatus,
    RefundStatus,
    UserRole,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { RidesGateway } from "../rides/rides.gateway";
import { PAYMENT_PROVIDER } from "./payment.constants";
import type { PaymentProvider } from "./providers/payment-provider.interface";

export type SanitizedRefund = {
    id: string;
    rideId: string;
    paymentId: string;
    userId: string;
    amount: number;
    currency: string;
    status: RefundStatus;
    reason?: string | null;
    failureReason?: string | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date | null;
};

@Injectable()
export class RefundService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RefundService.name);
    private recoveryInterval: NodeJS.Timeout | null = null;

    constructor(
        private readonly prisma: PrismaService,
        @Inject(PAYMENT_PROVIDER)
        private readonly paymentProvider: PaymentProvider,
        private readonly ridesGateway: RidesGateway,
    ) { }

    onModuleInit() {
        // Run initial crash recovery
        void this.recoverCrashedJobs();
        // Periodic background crash recovery and pending job processor every 30 seconds
        this.recoveryInterval = setInterval(() => {
            void this.recoverCrashedJobs();
            void this.processPendingJobs();
        }, 30_000);
    }

    onModuleDestroy() {
        if (this.recoveryInterval) {
            clearInterval(this.recoveryInterval);
            this.recoveryInterval = null;
        }
    }

    /**
     * Creates eligible refund and durable refund job in the SAME transaction as cancellation.
     * Guaranteed NO network calls inside this method.
     */
    async createRefundForRide(
        tx: Prisma.TransactionClient,
        rideId: string,
        riderId: string,
        reason?: string | null,
    ): Promise<{
        refund: SanitizedRefund;
        jobId: string;
    } | null> {
        const payment = await tx.payment.findUnique({
            where: { rideId },
        });

        if (!payment) {
            return null;
        }

        // Cash payments never involve digital refunds; cancel if pending
        if (payment.method === PaymentMethod.CASH) {
            if (payment.status === PaymentStatus.PENDING) {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: { status: PaymentStatus.CANCELLED },
                });
            }
            return null;
        }

        // If payment already failed or cancelled, nothing to refund
        if (
            payment.status === PaymentStatus.FAILED ||
            payment.status === PaymentStatus.CANCELLED
        ) {
            return null;
        }

        // Prevent duplicate refunds for the same payment/ride (Req 7)
        const existingRefund = await tx.refund.findUnique({
            where: { paymentId: payment.id },
            include: { job: true },
        });

        if (existingRefund) {
            return {
                refund: this.sanitizeRefund(existingRefund),
                jobId: existingRefund.job?.id ?? "",
            };
        }

        const refund = await tx.refund.create({
            data: {
                paymentId: payment.id,
                rideId,
                userId: riderId,
                amount: payment.amount,
                currency: payment.currency,
                status: RefundStatus.PENDING,
                reason: reason ?? "Ride cancelled",
                provider: payment.provider ?? this.paymentProvider.providerName,
            },
        });

        // Stable, deterministic idempotency key
        const idempotencyKey = `ref_job_${refund.id}_${payment.providerPaymentId ?? payment.id}`;

        const job = await tx.refundJob.create({
            data: {
                refundId: refund.id,
                idempotencyKey,
                status: RefundJobStatus.PENDING,
                attempts: 0,
                maxAttempts: 5,
                nextRetryAt: new Date(),
            },
        });

        return {
            refund: this.sanitizeRefund(refund),
            jobId: job.id,
        };
    }

    /**
     * Processes durable refund job with idempotency, provider reconciliation, and safe retries.
     * Executes OUTSIDE of any database transaction.
     */
    async processRefundJob(jobId: string): Promise<void> {
        if (!jobId) return;

        const workerId = `worker_${process.pid}_${Math.random().toString(36).substring(2, 7)}`;
        const lockTimeout = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes

        // Step 1: Lock the job
        const job = await this.prisma.refundJob.findUnique({
            where: { id: jobId },
            include: {
                refund: {
                    include: {
                        payment: true,
                        ride: true,
                    },
                },
            },
        });

        if (!job || job.status === RefundJobStatus.COMPLETED) {
            return;
        }

        // If locked by another active worker, do not interfere
        if (
            job.status === RefundJobStatus.PROCESSING &&
            job.lockedAt &&
            job.lockedAt > lockTimeout
        ) {
            return;
        }

        await this.prisma.refundJob.update({
            where: { id: job.id },
            data: {
                status: RefundJobStatus.PROCESSING,
                lockedAt: new Date(),
                lockedBy: workerId,
                attempts: { increment: 1 },
            },
        });

        const payment = job.refund.payment;

        // Step 2: Handle pending/processing payments through provider reconciliation (Req 8)
        if (
            payment.status === PaymentStatus.PROCESSING ||
            payment.status === PaymentStatus.PENDING
        ) {
            if (
                payment.providerPaymentId &&
                this.paymentProvider.getPaymentStatus
            ) {
                try {
                    const statusResult = await this.callWithTimeout(
                        () =>
                            this.paymentProvider.getPaymentStatus!(
                                payment.providerPaymentId!,
                            ),
                        10_000,
                    );

                    if (statusResult.status === PaymentStatus.SUCCEEDED) {
                        await this.prisma.payment.update({
                            where: { id: payment.id },
                            data: { status: PaymentStatus.SUCCEEDED },
                        });
                        payment.status = PaymentStatus.SUCCEEDED;
                    } else if (
                        statusResult.status === PaymentStatus.FAILED ||
                        statusResult.status === PaymentStatus.CANCELLED
                    ) {
                        await this.prisma.payment.update({
                            where: { id: payment.id },
                            data: {
                                status: statusResult.status,
                                failureReason:
                                    statusResult.failureReason ??
                                    "Payment was not captured",
                            },
                        });

                        await this.prisma.refund.update({
                            where: { id: job.refund.id },
                            data: {
                                status: RefundStatus.FAILED,
                                failureReason: "Original payment was not captured",
                            },
                        });

                        await this.prisma.refundJob.update({
                            where: { id: job.id },
                            data: {
                                status: RefundJobStatus.COMPLETED,
                                lockedAt: null,
                            },
                        });

                        this.emitRefundUpdated(
                            job.refund.userId,
                            job.refund.id,
                            job.refund.rideId,
                            payment.id,
                            RefundStatus.FAILED,
                            Number(job.refund.amount),
                            job.refund.currency,
                            "Original payment was not captured",
                        );
                        return;
                    } else {
                        // Still pending with provider — retry later, do NOT guess capture or failure
                        const backoffMs = Math.min(
                            60_000,
                            1_000 * Math.pow(2, job.attempts),
                        );
                        await this.prisma.refundJob.update({
                            where: { id: job.id },
                            data: {
                                status: RefundJobStatus.PENDING,
                                lockedAt: null,
                                lastError: "Payment is still processing with provider",
                                nextRetryAt: new Date(Date.now() + backoffMs),
                            },
                        });
                        return;
                    }
                } catch (err) {
                    // Provider timeout/network error: treat as unknown outcome and retry safely
                    const backoffMs = Math.min(
                        60_000,
                        1_000 * Math.pow(2, job.attempts),
                    );
                    await this.prisma.refundJob.update({
                        where: { id: job.id },
                        data: {
                            status: RefundJobStatus.PENDING,
                            lockedAt: null,
                            lastError:
                                err instanceof Error
                                    ? err.message
                                    : "Provider reconciliation timed out",
                            nextRetryAt: new Date(Date.now() + backoffMs),
                        },
                    });
                    return;
                }
            }
        }

        // Step 3: Process eligible refund with payment provider
        if (payment.status === PaymentStatus.SUCCEEDED) {
            try {
                const refundResult = await this.callWithTimeout(
                    () =>
                        this.paymentProvider.refundPayment({
                            refundId: job.refund.id,
                            paymentId: payment.id,
                            providerPaymentId: payment.providerPaymentId,
                            amount: Number(job.refund.amount),
                            currency: job.refund.currency,
                            idempotencyKey: job.idempotencyKey,
                            reason: job.refund.reason,
                        }),
                    10_000,
                );

                if (refundResult.status === RefundStatus.SUCCEEDED) {
                    await this.prisma.refund.update({
                        where: { id: job.refund.id },
                        data: {
                            status: RefundStatus.SUCCEEDED,
                            provider: refundResult.provider,
                            providerRefundId: refundResult.providerRefundId,
                            completedAt: new Date(),
                        },
                    });

                    await this.prisma.refundJob.update({
                        where: { id: job.id },
                        data: {
                            status: RefundJobStatus.COMPLETED,
                            lockedAt: null,
                            lastError: null,
                        },
                    });

                    this.emitRefundUpdated(
                        job.refund.userId,
                        job.refund.id,
                        job.refund.rideId,
                        payment.id,
                        RefundStatus.SUCCEEDED,
                        Number(job.refund.amount),
                        job.refund.currency,
                    );
                    return;
                } else {
                    if (job.attempts >= job.maxAttempts) {
                        await this.prisma.refund.update({
                            where: { id: job.refund.id },
                            data: {
                                status: RefundStatus.FAILED,
                                failureReason:
                                    refundResult.failureReason ??
                                    "Refund rejected by provider",
                            },
                        });

                        await this.prisma.refundJob.update({
                            where: { id: job.id },
                            data: {
                                status: RefundJobStatus.FAILED,
                                lockedAt: null,
                                lastError: refundResult.failureReason,
                            },
                        });

                        this.emitRefundUpdated(
                            job.refund.userId,
                            job.refund.id,
                            job.refund.rideId,
                            payment.id,
                            RefundStatus.FAILED,
                            Number(job.refund.amount),
                            job.refund.currency,
                            refundResult.failureReason,
                        );
                    } else {
                        const backoffMs = Math.min(
                            60_000,
                            1_000 * Math.pow(2, job.attempts),
                        );
                        await this.prisma.refundJob.update({
                            where: { id: job.id },
                            data: {
                                status: RefundJobStatus.PENDING,
                                lockedAt: null,
                                lastError: refundResult.failureReason,
                                nextRetryAt: new Date(Date.now() + backoffMs),
                            },
                        });
                    }
                }
            } catch (err) {
                // Timeout / network error: treat as unknown outcome and retry safely
                const backoffMs = Math.min(
                    60_000,
                    1_000 * Math.pow(2, job.attempts),
                );
                await this.prisma.refundJob.update({
                    where: { id: job.id },
                    data: {
                        status: RefundJobStatus.PENDING,
                        lockedAt: null,
                        lastError:
                            err instanceof Error
                                ? err.message
                                : "Refund request timed out",
                        nextRetryAt: new Date(Date.now() + backoffMs),
                    },
                });
            }
        }
    }

    /**
     * Crash recovery: Reclaims jobs abandoned due to a process crash or restart.
     */
    async recoverCrashedJobs(): Promise<void> {
        try {
            const crashThreshold = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes
            const abandonedJobs = await this.prisma.refundJob.findMany({
                where: {
                    status: RefundJobStatus.PROCESSING,
                    lockedAt: { lt: crashThreshold },
                },
            });

            for (const job of abandonedJobs) {
                this.logger.warn(`Recovering abandoned refund job ${job.id}`);
                await this.prisma.refundJob.update({
                    where: { id: job.id },
                    data: {
                        status: RefundJobStatus.PENDING,
                        lockedAt: null,
                    },
                });
                void this.processRefundJob(job.id);
            }
        } catch (err) {
            this.logger.error("Error during refund crash recovery", err);
        }
    }

    /**
     * Processes pending retry jobs whose nextRetryAt has arrived.
     */
    async processPendingJobs(): Promise<void> {
        try {
            const pendingJobs = await this.prisma.refundJob.findMany({
                where: {
                    status: RefundJobStatus.PENDING,
                    nextRetryAt: { lte: new Date() },
                },
                take: 10,
            });

            for (const job of pendingJobs) {
                void this.processRefundJob(job.id);
            }
        } catch (err) {
            this.logger.error("Error processing pending refund jobs", err);
        }
    }

    /**
     * Ownership-checked refund read by ride ID.
     */
    async getRefundForRide(
        rideId: string,
        authenticatedUserId: string,
        userRole: UserRole,
    ): Promise<SanitizedRefund | null> {
        const ride = await this.prisma.ride.findUnique({
            where: { id: rideId },
            include: {
                driver: true,
            },
        });

        if (!ride) {
            throw new NotFoundException("Ride not found");
        }

        if (
            userRole !== UserRole.ADMIN &&
            ride.riderId !== authenticatedUserId &&
            ride.driver?.userId !== authenticatedUserId
        ) {
            throw new ForbiddenException(
                "You are not authorized to view refund details for this ride",
            );
        }

        const refund = await this.prisma.refund.findUnique({
            where: { rideId },
        });

        if (!refund) {
            return null;
        }

        return this.sanitizeRefund(refund);
    }

    /**
     * Ownership-checked refund read by refund ID.
     */
    async getRefundById(
        id: string,
        authenticatedUserId: string,
        userRole: UserRole,
    ): Promise<SanitizedRefund> {
        const refund = await this.prisma.refund.findUnique({
            where: { id },
            include: {
                ride: {
                    include: {
                        driver: true,
                    },
                },
            },
        });

        if (!refund) {
            throw new NotFoundException("Refund not found");
        }

        if (
            userRole !== UserRole.ADMIN &&
            refund.userId !== authenticatedUserId &&
            refund.ride.driver?.userId !== authenticatedUserId
        ) {
            throw new ForbiddenException(
                "You are not authorized to view this refund",
            );
        }

        return this.sanitizeRefund(refund);
    }

    private emitRefundUpdated(
        userId: string,
        refundId: string,
        rideId: string,
        paymentId: string,
        status: RefundStatus,
        amount: number,
        currency: string,
        failureReason?: string,
    ) {
        this.ridesGateway.emitRefundUpdated(userId, {
            refundId,
            rideId,
            paymentId,
            status,
            amount,
            currency,
            failureReason: failureReason ?? null,
        });
    }

    private callWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Operation timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            fn()
                .then((res) => {
                    clearTimeout(timer);
                    resolve(res);
                })
                .catch((err) => {
                    clearTimeout(timer);
                    reject(err);
                });
        });
    }

    private sanitizeRefund(refund: {
        id: string;
        rideId: string;
        paymentId: string;
        userId: string;
        amount: unknown;
        currency: string;
        status: RefundStatus;
        reason?: string | null;
        failureReason?: string | null;
        createdAt: Date;
        updatedAt: Date;
        completedAt?: Date | null;
    }): SanitizedRefund {
        return {
            id: refund.id,
            rideId: refund.rideId,
            paymentId: refund.paymentId,
            userId: refund.userId,
            amount: Number(refund.amount),
            currency: refund.currency,
            status: refund.status,
            reason: refund.reason ?? null,
            failureReason: refund.failureReason ?? null,
            createdAt: refund.createdAt,
            updatedAt: refund.updatedAt,
            completedAt: refund.completedAt ?? null,
        };
    }
}
