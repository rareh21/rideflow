import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import {
    PaymentMethod,
    PaymentStatus,
    RefundJobStatus,
    RefundStatus,
    UserRole,
} from "@prisma/client";

import { RefundService } from "./refund.service";
import { PAYMENT_PROVIDER } from "./payment.constants";
import type { PaymentProvider } from "./providers/payment-provider.interface";
import { PrismaService } from "../prisma/prisma.service";
import { RidesGateway } from "../rides/rides.gateway";

const RIDER_ID = "rider-user-1";
const OTHER_USER_ID = "other-user-99";
const DRIVER_USER_ID = "driver-user-1";
const RIDE_ID = "ride-uuid-101";
const PAYMENT_ID = "pay-uuid-202";
const REFUND_ID = "ref-uuid-303";
const JOB_ID = "job-uuid-404";

describe("RefundService", () => {
    let service: RefundService;
    let mockPaymentProvider: jest.Mocked<PaymentProvider>;
    let mockRidesGateway: jest.Mocked<RidesGateway>;
    let mockPrisma: any;

    beforeEach(async () => {
        mockPaymentProvider = {
            providerName: "mock",
            createPayment: jest.fn(),
            processPayment: jest.fn(),
            getPaymentStatus: jest.fn(),
            refundPayment: jest.fn(),
        };

        mockRidesGateway = {
            emitRefundUpdated: jest.fn(),
            emitRideUpdated: jest.fn(),
            emitRideCancelled: jest.fn(),
            emitRideRequestRemoved: jest.fn(),
        } as any;

        mockPrisma = {
            payment: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
            refund: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            refundJob: {
                findUnique: jest.fn(),
                findMany: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            ride: {
                findUnique: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RefundService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: PAYMENT_PROVIDER, useValue: mockPaymentProvider },
                { provide: RidesGateway, useValue: mockRidesGateway },
            ],
        }).compile();

        service = module.get<RefundService>(RefundService);
        // Clear background interval created in onModuleInit to avoid open handles
        service.onModuleDestroy();
    });

    describe("createRefundForRide", () => {
        it("creates refund record and durable refund job in the same transaction for captured digital payment", async () => {
            const mockPayment = {
                id: PAYMENT_ID,
                rideId: RIDE_ID,
                userId: RIDER_ID,
                amount: "250.00",
                currency: "INR",
                method: PaymentMethod.UPI,
                status: PaymentStatus.SUCCEEDED,
                provider: "mock",
                providerPaymentId: "mock_pay_123",
            };

            const tx: any = {
                payment: {
                    findUnique: jest.fn().mockResolvedValue(mockPayment),
                },
                refund: {
                    findUnique: jest.fn().mockResolvedValue(null),
                    create: jest.fn().mockImplementation(({ data }) =>
                        Promise.resolve({
                            id: REFUND_ID,
                            ...data,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }),
                    ),
                },
                refundJob: {
                    create: jest.fn().mockImplementation(({ data }) =>
                        Promise.resolve({
                            id: JOB_ID,
                            ...data,
                        }),
                    ),
                },
            };

            const result = await service.createRefundForRide(
                tx,
                RIDE_ID,
                RIDER_ID,
                "Driver taking too long",
            );

            expect(result).toBeDefined();
            expect(result?.refund.id).toBe(REFUND_ID);
            expect(result?.refund.amount).toBe(250);
            expect(result?.refund.status).toBe(RefundStatus.PENDING);
            expect(result?.jobId).toBe(JOB_ID);

            expect(tx.refund.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    paymentId: PAYMENT_ID,
                    rideId: RIDE_ID,
                    userId: RIDER_ID,
                    amount: "250.00",
                    currency: "INR",
                    status: RefundStatus.PENDING,
                }),
            });

            expect(tx.refundJob.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    refundId: REFUND_ID,
                    status: RefundJobStatus.PENDING,
                    attempts: 0,
                    idempotencyKey: expect.stringContaining("ref_job_"),
                }),
            });
        });

        it("creates refund record and job for PENDING/PROCESSING payments to allow safe provider reconciliation", async () => {
            const mockPayment = {
                id: PAYMENT_ID,
                rideId: RIDE_ID,
                userId: RIDER_ID,
                amount: "180.00",
                currency: "INR",
                method: PaymentMethod.CARD,
                status: PaymentStatus.PROCESSING,
                provider: "mock",
                providerPaymentId: "mock_pay_processing",
            };

            const tx: any = {
                payment: {
                    findUnique: jest.fn().mockResolvedValue(mockPayment),
                },
                refund: {
                    findUnique: jest.fn().mockResolvedValue(null),
                    create: jest.fn().mockResolvedValue({
                        id: REFUND_ID,
                        paymentId: PAYMENT_ID,
                        rideId: RIDE_ID,
                        userId: RIDER_ID,
                        amount: "180.00",
                        currency: "INR",
                        status: RefundStatus.PENDING,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }),
                },
                refundJob: {
                    create: jest.fn().mockResolvedValue({
                        id: JOB_ID,
                        refundId: REFUND_ID,
                    }),
                },
            };

            const result = await service.createRefundForRide(tx, RIDE_ID, RIDER_ID);

            expect(result).toBeDefined();
            expect(tx.refund.create).toHaveBeenCalled();
            expect(tx.refundJob.create).toHaveBeenCalled();
        });

        it("cancels pending CASH payment and creates NO digital refund", async () => {
            const mockPayment = {
                id: PAYMENT_ID,
                rideId: RIDE_ID,
                userId: RIDER_ID,
                amount: "300.00",
                currency: "INR",
                method: PaymentMethod.CASH,
                status: PaymentStatus.PENDING,
            };

            const tx: any = {
                payment: {
                    findUnique: jest.fn().mockResolvedValue(mockPayment),
                    update: jest.fn().mockResolvedValue({ ...mockPayment, status: PaymentStatus.CANCELLED }),
                },
                refund: {
                    create: jest.fn(),
                },
            };

            const result = await service.createRefundForRide(tx, RIDE_ID, RIDER_ID);

            expect(result).toBeNull();
            expect(tx.payment.update).toHaveBeenCalledWith({
                where: { id: PAYMENT_ID },
                data: { status: PaymentStatus.CANCELLED },
            });
            expect(tx.refund.create).not.toHaveBeenCalled();
        });

        it("prevents duplicate refunds if a refund already exists for the payment (idempotency)", async () => {
            const mockPayment = {
                id: PAYMENT_ID,
                rideId: RIDE_ID,
                userId: RIDER_ID,
                amount: "250.00",
                currency: "INR",
                method: PaymentMethod.UPI,
                status: PaymentStatus.SUCCEEDED,
            };

            const existingRefund = {
                id: REFUND_ID,
                paymentId: PAYMENT_ID,
                rideId: RIDE_ID,
                userId: RIDER_ID,
                amount: "250.00",
                currency: "INR",
                status: RefundStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date(),
                job: { id: JOB_ID },
            };

            const tx: any = {
                payment: {
                    findUnique: jest.fn().mockResolvedValue(mockPayment),
                },
                refund: {
                    findUnique: jest.fn().mockResolvedValue(existingRefund),
                    create: jest.fn(),
                },
                refundJob: {
                    create: jest.fn(),
                },
            };

            const result = await service.createRefundForRide(tx, RIDE_ID, RIDER_ID);

            expect(result?.refund.id).toBe(REFUND_ID);
            expect(result?.jobId).toBe(JOB_ID);
            expect(tx.refund.create).not.toHaveBeenCalled();
            expect(tx.refundJob.create).not.toHaveBeenCalled();
        });

        it("returns null if payment already failed or cancelled", async () => {
            const mockPayment = {
                id: PAYMENT_ID,
                rideId: RIDE_ID,
                userId: RIDER_ID,
                amount: "250.00",
                currency: "INR",
                method: PaymentMethod.UPI,
                status: PaymentStatus.FAILED,
            };

            const tx: any = {
                payment: {
                    findUnique: jest.fn().mockResolvedValue(mockPayment),
                },
                refund: {
                    create: jest.fn(),
                },
            };

            const result = await service.createRefundForRide(tx, RIDE_ID, RIDER_ID);
            expect(result).toBeNull();
            expect(tx.refund.create).not.toHaveBeenCalled();
        });
    });

    describe("processRefundJob", () => {
        it("successfully executes provider refund for SUCCEEDED payment and emits realtime notification", async () => {
            const mockJob = {
                id: JOB_ID,
                refundId: REFUND_ID,
                idempotencyKey: "idemp_key_1",
                status: RefundJobStatus.PENDING,
                attempts: 0,
                maxAttempts: 5,
                lockedAt: null,
                refund: {
                    id: REFUND_ID,
                    rideId: RIDE_ID,
                    userId: RIDER_ID,
                    amount: "250.00",
                    currency: "INR",
                    status: RefundStatus.PENDING,
                    reason: "Change of plans",
                    payment: {
                        id: PAYMENT_ID,
                        status: PaymentStatus.SUCCEEDED,
                        providerPaymentId: "mock_pay_1",
                    },
                },
            };

            mockPrisma.refundJob.findUnique.mockResolvedValue(mockJob);
            mockPrisma.refundJob.update.mockResolvedValue({});
            mockPrisma.refund.update.mockResolvedValue({});

            mockPaymentProvider.refundPayment.mockResolvedValue({
                provider: "mock",
                providerRefundId: "mock_ref_999",
                status: RefundStatus.SUCCEEDED,
            });

            await service.processRefundJob(JOB_ID);

            expect(mockPaymentProvider.refundPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    refundId: REFUND_ID,
                    paymentId: PAYMENT_ID,
                    amount: 250,
                    currency: "INR",
                    idempotencyKey: "idemp_key_1",
                }),
            );

            expect(mockPrisma.refund.update).toHaveBeenCalledWith({
                where: { id: REFUND_ID },
                data: expect.objectContaining({
                    status: RefundStatus.SUCCEEDED,
                    providerRefundId: "mock_ref_999",
                }),
            });

            expect(mockPrisma.refundJob.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: JOB_ID },
                    data: expect.objectContaining({
                        status: RefundJobStatus.COMPLETED,
                    }),
                }),
            );

            expect(mockRidesGateway.emitRefundUpdated).toHaveBeenCalledWith(
                RIDER_ID,
                expect.objectContaining({
                    refundId: REFUND_ID,
                    rideId: RIDE_ID,
                    status: RefundStatus.SUCCEEDED,
                    amount: 250,
                }),
            );
        });

        it("reconciles PENDING payment with provider before refunding", async () => {
            const mockJob = {
                id: JOB_ID,
                refundId: REFUND_ID,
                idempotencyKey: "idemp_key_pending",
                status: RefundJobStatus.PENDING,
                attempts: 0,
                maxAttempts: 5,
                lockedAt: null,
                refund: {
                    id: REFUND_ID,
                    rideId: RIDE_ID,
                    userId: RIDER_ID,
                    amount: "200.00",
                    currency: "INR",
                    status: RefundStatus.PENDING,
                    reason: "Change of plans",
                    payment: {
                        id: PAYMENT_ID,
                        status: PaymentStatus.PENDING,
                        providerPaymentId: "mock_pay_in_flight",
                    },
                },
            };

            mockPrisma.refundJob.findUnique.mockResolvedValue(mockJob);
            mockPrisma.refundJob.update.mockResolvedValue({});
            mockPrisma.payment.update.mockResolvedValue({});
            mockPrisma.refund.update.mockResolvedValue({});

            // Provider reports payment actually succeeded!
            mockPaymentProvider.getPaymentStatus!.mockResolvedValue({
                provider: "mock",
                providerPaymentId: "mock_pay_in_flight",
                status: PaymentStatus.SUCCEEDED,
            });

            mockPaymentProvider.refundPayment.mockResolvedValue({
                provider: "mock",
                providerRefundId: "mock_ref_888",
                status: RefundStatus.SUCCEEDED,
            });

            await service.processRefundJob(JOB_ID);

            // Reconciled payment status to SUCCEEDED
            expect(mockPrisma.payment.update).toHaveBeenCalledWith({
                where: { id: PAYMENT_ID },
                data: { status: PaymentStatus.SUCCEEDED },
            });

            // Then performed refund
            expect(mockPaymentProvider.refundPayment).toHaveBeenCalled();
            expect(mockPrisma.refund.update).toHaveBeenCalledWith({
                where: { id: REFUND_ID },
                data: expect.objectContaining({
                    status: RefundStatus.SUCCEEDED,
                }),
            });
        });

        it("handles payment provider reconciliation failure by voiding refund safely", async () => {
            const mockJob = {
                id: JOB_ID,
                refundId: REFUND_ID,
                idempotencyKey: "idemp_key_failed",
                status: RefundJobStatus.PENDING,
                attempts: 0,
                maxAttempts: 5,
                lockedAt: null,
                refund: {
                    id: REFUND_ID,
                    rideId: RIDE_ID,
                    userId: RIDER_ID,
                    amount: "150.00",
                    currency: "INR",
                    status: RefundStatus.PENDING,
                    payment: {
                        id: PAYMENT_ID,
                        status: PaymentStatus.PENDING,
                        providerPaymentId: "mock_pay_declined",
                    },
                },
            };

            mockPrisma.refundJob.findUnique.mockResolvedValue(mockJob);
            mockPrisma.refundJob.update.mockResolvedValue({});
            mockPrisma.payment.update.mockResolvedValue({});
            mockPrisma.refund.update.mockResolvedValue({});

            // Provider reconciliation: payment was actually declined/failed
            mockPaymentProvider.getPaymentStatus!.mockResolvedValue({
                provider: "mock",
                providerPaymentId: "mock_pay_declined",
                status: PaymentStatus.FAILED,
                failureReason: "Card declined by issuing bank",
            });

            await service.processRefundJob(JOB_ID);

            expect(mockPrisma.payment.update).toHaveBeenCalledWith({
                where: { id: PAYMENT_ID },
                data: expect.objectContaining({
                    status: PaymentStatus.FAILED,
                }),
            });

            expect(mockPrisma.refund.update).toHaveBeenCalledWith({
                where: { id: REFUND_ID },
                data: expect.objectContaining({
                    status: RefundStatus.FAILED,
                }),
            });

            expect(mockPaymentProvider.refundPayment).not.toHaveBeenCalled();
            expect(mockRidesGateway.emitRefundUpdated).toHaveBeenCalledWith(
                RIDER_ID,
                expect.objectContaining({
                    status: RefundStatus.FAILED,
                }),
            );
        });

        it("treats provider refund timeout as unknown outcome and safely reschedules retry without marking failed or succeeded", async () => {
            const mockJob = {
                id: JOB_ID,
                refundId: REFUND_ID,
                idempotencyKey: "idemp_timeout",
                status: RefundJobStatus.PENDING,
                attempts: 1,
                maxAttempts: 5,
                lockedAt: null,
                refund: {
                    id: REFUND_ID,
                    rideId: RIDE_ID,
                    userId: RIDER_ID,
                    amount: "300.00",
                    currency: "INR",
                    status: RefundStatus.PENDING,
                    payment: {
                        id: PAYMENT_ID,
                        status: PaymentStatus.SUCCEEDED,
                        providerPaymentId: "mock_pay_timeout",
                    },
                },
            };

            mockPrisma.refundJob.findUnique.mockResolvedValue(mockJob);
            mockPrisma.refundJob.update.mockResolvedValue({});

            // Provider throws timeout error
            mockPaymentProvider.refundPayment.mockRejectedValue(new Error("Gateway connection timed out"));

            await service.processRefundJob(JOB_ID);

            // Must NOT mark refund as failed or succeeded
            expect(mockPrisma.refund.update).not.toHaveBeenCalled();

            // Must reschedule job as PENDING with nextRetryAt
            expect(mockPrisma.refundJob.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: JOB_ID },
                    data: expect.objectContaining({
                        status: RefundJobStatus.PENDING,
                        lockedAt: null,
                        lastError: "Gateway connection timed out",
                    }),
                }),
            );
        });
    });

    describe("recoverCrashedJobs", () => {
        it("reclaims abandoned jobs with expired locks and restarts processing", async () => {
            const abandonedJob = {
                id: "crashed-job-1",
                status: RefundJobStatus.PROCESSING,
                lockedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago (> 2 min lock timeout)
            };

            mockPrisma.refundJob.findMany.mockResolvedValue([abandonedJob]);
            mockPrisma.refundJob.update.mockResolvedValue({});
            mockPrisma.refundJob.findUnique.mockResolvedValue(null); // Stop further recursive execution in mock

            await service.recoverCrashedJobs();

            expect(mockPrisma.refundJob.update).toHaveBeenCalledWith({
                where: { id: "crashed-job-1" },
                data: {
                    status: RefundJobStatus.PENDING,
                    lockedAt: null,
                },
            });
        });
    });

    describe("Ownership & authorization on refund read endpoints", () => {
        it("allows rider to read refund for their ride", async () => {
            mockPrisma.ride.findUnique.mockResolvedValue({
                id: RIDE_ID,
                riderId: RIDER_ID,
                driver: { userId: DRIVER_USER_ID },
            });

            mockPrisma.refund.findUnique.mockResolvedValue({
                id: REFUND_ID,
                rideId: RIDE_ID,
                paymentId: PAYMENT_ID,
                userId: RIDER_ID,
                amount: "250.00",
                currency: "INR",
                status: RefundStatus.SUCCEEDED,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const result = await service.getRefundForRide(RIDE_ID, RIDER_ID, UserRole.RIDER);
            expect(result).toBeDefined();
            expect(result?.id).toBe(REFUND_ID);
            expect(result?.amount).toBe(250);
        });

        it("allows assigned driver to read refund for their ride", async () => {
            mockPrisma.ride.findUnique.mockResolvedValue({
                id: RIDE_ID,
                riderId: RIDER_ID,
                driver: { userId: DRIVER_USER_ID },
            });

            mockPrisma.refund.findUnique.mockResolvedValue({
                id: REFUND_ID,
                rideId: RIDE_ID,
                paymentId: PAYMENT_ID,
                userId: RIDER_ID,
                amount: "250.00",
                currency: "INR",
                status: RefundStatus.SUCCEEDED,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const result = await service.getRefundForRide(RIDE_ID, DRIVER_USER_ID, UserRole.DRIVER);
            expect(result).toBeDefined();
            expect(result?.id).toBe(REFUND_ID);
        });

        it("forbids unauthorized users from reading refund", async () => {
            mockPrisma.ride.findUnique.mockResolvedValue({
                id: RIDE_ID,
                riderId: RIDER_ID,
                driver: { userId: DRIVER_USER_ID },
            });

            await expect(
                service.getRefundForRide(RIDE_ID, OTHER_USER_ID, UserRole.RIDER),
            ).rejects.toThrow(ForbiddenException);
        });

        it("throws NotFoundException when ride does not exist", async () => {
            mockPrisma.ride.findUnique.mockResolvedValue(null);

            await expect(
                service.getRefundForRide("non-existent-ride", RIDER_ID, UserRole.RIDER),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
