import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

import { PaymentService } from "./payment.service";
import { MockPaymentProvider } from "./providers/mock-payment.provider";
import { PrismaService } from "../prisma/prisma.service";
import { isValidPaymentTransition } from "./payment-status";

const RIDER_ID = "rider-user-1";
const OTHER_RIDER_ID = "rider-user-2";
const DRIVER_USER_ID = "driver-user-1";
const RIDE_ID = "ride-uuid-1";

const MOCK_RIDE = {
    id: RIDE_ID,
    riderId: RIDER_ID,
    driverId: "driver-uuid-1",
    pickupLocationId: "pickup-1",
    destinationLocationId: "dest-1",
    rideType: "GO",
    status: "COMPLETED",
    estimatedFare: "245",
    estimatedDistanceKm: "5.6",
    estimatedDurationMinutes: 14,
    paymentMethod: PaymentMethod.UPI,
    createdAt: new Date(),
    updatedAt: new Date(),
    driver: {
        userId: DRIVER_USER_ID,
    },
};

function buildPrismaStub() {
    let paymentStore: Record<string, any> = {};

    return {
        ride: {
            findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
                if (where.id === RIDE_ID) {
                    return Promise.resolve(MOCK_RIDE);
                }
                return Promise.resolve(null);
            }),
        },
        payment: {
            create: jest.fn().mockImplementation(({ data }: { data: any }) => {
                const record = {
                    id: `pay-${Math.random().toString(36).substring(2, 9)}`,
                    provider: null,
                    providerPaymentId: null,
                    failureReason: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ...data,
                };
                paymentStore[data.rideId] = record;
                paymentStore[record.id] = record;
                return Promise.resolve(record);
            }),
            findUnique: jest.fn().mockImplementation(({ where }: { where: { id?: string; rideId?: string } }) => {
                if (where.rideId && paymentStore[where.rideId]) {
                    return Promise.resolve(paymentStore[where.rideId]);
                }
                if (where.id && paymentStore[where.id]) {
                    return Promise.resolve(paymentStore[where.id]);
                }
                return Promise.resolve(null);
            }),
            findMany: jest.fn().mockImplementation(({ where }: { where: { userId: string } }) => {
                const list = Object.values(paymentStore).filter((p) => p.userId === where.userId);
                return Promise.resolve(list);
            }),
            update: jest.fn().mockImplementation(({ where, data }: { where: { id: string }; data: any }) => {
                const record = paymentStore[where.id];
                if (!record) return Promise.resolve(null);
                Object.assign(record, data, { updatedAt: new Date() });
                return Promise.resolve(record);
            }),
        },
    };
}

describe("PaymentStatus state transitions", () => {
    it("allows valid transitions", () => {
        expect(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.PROCESSING)).toBe(true);
        expect(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.SUCCEEDED)).toBe(true);
        expect(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.FAILED)).toBe(true);
        expect(isValidPaymentTransition(PaymentStatus.PROCESSING, PaymentStatus.SUCCEEDED)).toBe(true);
        expect(isValidPaymentTransition(PaymentStatus.PROCESSING, PaymentStatus.FAILED)).toBe(true);
        expect(isValidPaymentTransition(PaymentStatus.FAILED, PaymentStatus.PROCESSING)).toBe(true);
    });

    it("rejects invalid transitions", () => {
        expect(isValidPaymentTransition(PaymentStatus.SUCCEEDED, PaymentStatus.PENDING)).toBe(false);
        expect(isValidPaymentTransition(PaymentStatus.SUCCEEDED, PaymentStatus.FAILED)).toBe(false);
        expect(isValidPaymentTransition(PaymentStatus.CANCELLED, PaymentStatus.SUCCEEDED)).toBe(false);
    });
});

describe("PaymentService", () => {
    let service: PaymentService;
    let prisma: ReturnType<typeof buildPrismaStub>;
    let mockProvider: MockPaymentProvider;

    beforeEach(async () => {
        prisma = buildPrismaStub();
        mockProvider = new MockPaymentProvider();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentService,
                { provide: PrismaService, useValue: prisma },
                { provide: MockPaymentProvider, useValue: mockProvider },
            ],
        }).compile();

        service = module.get<PaymentService>(PaymentService);
    });

    describe("createPaymentForRide", () => {
        it("allows Rider to create payment for own ride using server-authoritative fare", async () => {
            const payment = await service.createPaymentForRide(RIDE_ID, RIDER_ID);

            expect(payment).toBeDefined();
            expect(payment.rideId).toBe(RIDE_ID);
            expect(payment.userId).toBe(RIDER_ID);
            expect(payment.amount).toBe(245);
            expect(payment.currency).toBe("INR");
            expect(payment.method).toBe(PaymentMethod.UPI);
            expect(payment.status).toBe(PaymentStatus.SUCCEEDED);
            expect(payment.provider).toBe("mock");
        });

        it("prevents Rider from creating payment for another rider's ride", async () => {
            await expect(
                service.createPaymentForRide(RIDE_ID, OTHER_RIDER_ID),
            ).rejects.toThrow(ForbiddenException);
        });

        it("throws NotFoundException if ride does not exist", async () => {
            await expect(
                service.createPaymentForRide("non-existent-ride", RIDER_ID),
            ).rejects.toThrow(NotFoundException);
        });

        it("is idempotent: duplicate calls return the existing payment", async () => {
            const payment1 = await service.createPaymentForRide(RIDE_ID, RIDER_ID);
            const payment2 = await service.createPaymentForRide(RIDE_ID, RIDER_ID);

            expect(payment1.id).toBe(payment2.id);
            expect(prisma.payment.create).toHaveBeenCalledTimes(1); // Exactly 1 create call, second call returned existing record
        });

        it("handles CASH payment without calling digital payment provider", async () => {
            prisma.ride.findUnique.mockResolvedValueOnce({
                ...MOCK_RIDE,
                paymentMethod: PaymentMethod.CASH,
            });

            const payment = await service.createPaymentForRide(RIDE_ID, RIDER_ID);

            expect(payment.method).toBe(PaymentMethod.CASH);
            expect(payment.status).toBe(PaymentStatus.PENDING);
            expect(payment.provider).toBeNull();
            expect(payment.failureReason).toBeNull();
        });

        it("uses provider for CARD payment", async () => {
            prisma.ride.findUnique.mockResolvedValueOnce({
                ...MOCK_RIDE,
                paymentMethod: PaymentMethod.CARD,
            });

            const payment = await service.createPaymentForRide(RIDE_ID, RIDER_ID);

            expect(payment.method).toBe(PaymentMethod.CARD);
            expect(payment.status).toBe(PaymentStatus.SUCCEEDED);
            expect(payment.provider).toBe("mock");
        });

        it("handles provider failure gracefully", async () => {
            jest.spyOn(mockProvider, "createPayment").mockRejectedValueOnce(
                new Error("Provider error"),
            );

            const payment = await service.createPaymentForRide(RIDE_ID, RIDER_ID);

            expect(payment.status).toBe(PaymentStatus.FAILED);
            expect(payment.failureReason).toBe("Provider error");
        });
    });

    describe("getPaymentForRide", () => {
        it("allows rider to retrieve payment for own ride", async () => {
            await service.createPaymentForRide(RIDE_ID, RIDER_ID);

            const payment = await service.getPaymentForRide(RIDE_ID, RIDER_ID);

            expect(payment.rideId).toBe(RIDE_ID);
            expect(payment.amount).toBe(245);
        });

        it("denies access to unauthorized third party", async () => {
            await service.createPaymentForRide(RIDE_ID, RIDER_ID);

            await expect(
                service.getPaymentForRide(RIDE_ID, "random-user"),
            ).rejects.toThrow(ForbiddenException);
        });

        it("does not expose sensitive provider internal fields", async () => {
            const payment = await service.createPaymentForRide(RIDE_ID, RIDER_ID);

            expect((payment as any).providerSecret).toBeUndefined();
            expect((payment as any).privateToken).toBeUndefined();
        });
    });

    describe("processPayment", () => {
        it("allows retrying a failed payment via provider", async () => {
            prisma.ride.findUnique.mockResolvedValueOnce({
                ...MOCK_RIDE,
                paymentMethod: PaymentMethod.UPI,
            });

            jest.spyOn(mockProvider, "createPayment").mockResolvedValueOnce({
                provider: "mock",
                providerPaymentId: "mock-1",
                status: PaymentStatus.FAILED,
                failureReason: "Insufficient funds",
            });

            const initial = await service.createPaymentForRide(RIDE_ID, RIDER_ID);
            expect(initial.status).toBe(PaymentStatus.FAILED);

            const retried = await service.processPayment(initial.id, RIDER_ID, "success");
            expect(retried.status).toBe(PaymentStatus.SUCCEEDED);
        });

        it("rejects processing for CASH payments", async () => {
            prisma.ride.findUnique.mockResolvedValueOnce({
                ...MOCK_RIDE,
                paymentMethod: PaymentMethod.CASH,
            });

            const cashPayment = await service.createPaymentForRide(RIDE_ID, RIDER_ID);

            await expect(
                service.processPayment(cashPayment.id, RIDER_ID),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
