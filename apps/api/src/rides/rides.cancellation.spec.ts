import { Test, TestingModule } from "@nestjs/testing";
import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
} from "@nestjs/common";
import { CancellationReason, RideStatus, UserRole } from "@prisma/client";

import { RidesService } from "./rides.service";
import { PrismaService } from "../prisma/prisma.service";
import { RidesGateway } from "./rides.gateway";
import { RideTimeoutService } from "./ride-timeout.service";
import { RoutingService } from "./routing/routing.service";
import { RefundService } from "../payment/refund.service";

const RIDER_ID = "rider-1";
const OTHER_RIDER_ID = "rider-2";
const DRIVER_ID = "driver-1";
const DRIVER_USER_ID = "driver-user-1";
const RIDE_ID = "ride-cancel-101";

function buildRide(status: RideStatus, riderId = RIDER_ID) {
    return {
        id: RIDE_ID,
        riderId,
        driverId: status === RideStatus.SEARCHING_DRIVER ? null : DRIVER_ID,
        rideType: "GO",
        status,
        estimatedFare: "250.00",
        estimatedDistanceKm: "5.5",
        estimatedDurationMinutes: 15,
        paymentMethod: "UPI",
        pickupLocationId: "loc-pickup",
        destinationLocationId: "loc-dest",
        pickupLocation: { id: "loc-pickup", label: "Pickup", latitude: "17.4", longitude: "78.4" },
        destinationLocation: { id: "loc-dest", label: "Destination", latitude: "17.5", longitude: "78.5" },
        rider: { id: riderId, name: "Alice", email: "alice@example.com" },
        driver: status === RideStatus.SEARCHING_DRIVER ? null : {
            id: DRIVER_ID,
            status: "BUSY",
            userId: DRIVER_USER_ID,
            user: { id: DRIVER_USER_ID, name: "Bob" },
            vehicle: null,
        },
        payment: null,
        refund: null,
        reviews: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

describe("RidesService — Cancellation & Refunds (Batch 11)", () => {
    let service: RidesService;
    let mockPrisma: any;
    let mockGateway: any;
    let mockTimeout: any;
    let mockRefundService: any;
    let currentRide: any;

    beforeEach(async () => {
        currentRide = buildRide(RideStatus.SEARCHING_DRIVER);

        mockPrisma = {
            ride: {
                findUnique: jest.fn().mockImplementation(({ where }) => {
                    if (where.id === RIDE_ID) return Promise.resolve(currentRide);
                    return Promise.resolve(null);
                }),
                updateMany: jest.fn().mockImplementation(({ where, data }) => {
                    if (
                        where.id === RIDE_ID &&
                        where.riderId === currentRide.riderId &&
                        where.status === currentRide.status
                    ) {
                        Object.assign(currentRide, data, { updatedAt: new Date() });
                        return Promise.resolve({ count: 1 });
                    }
                    return Promise.resolve({ count: 0 });
                }),
                update: jest.fn().mockImplementation(({ where, data }) => {
                    Object.assign(currentRide, data, { updatedAt: new Date() });
                    return Promise.resolve(currentRide);
                }),
            },
            driver: {
                updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
            $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
        };

        mockGateway = {
            emitRideUpdated: jest.fn(),
            emitRideCancelled: jest.fn(),
            emitRideRequestRemoved: jest.fn(),
        };

        mockTimeout = {
            cancelTimer: jest.fn(),
            scheduleTimeout: jest.fn(),
        };

        mockRefundService = {
            createRefundForRide: jest.fn().mockResolvedValue({
                refund: {
                    id: "ref-1",
                    rideId: RIDE_ID,
                    amount: 250,
                    status: "PENDING",
                },
                jobId: "ref-job-1",
            }),
            processRefundJob: jest.fn().mockResolvedValue(undefined),
            getRefundForRide: jest.fn().mockResolvedValue({
                id: "ref-1",
                rideId: RIDE_ID,
                amount: 250,
                status: "PENDING",
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RidesService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: RidesGateway, useValue: mockGateway },
                { provide: RideTimeoutService, useValue: mockTimeout },
                { provide: RoutingService, useValue: {} },
                { provide: RefundService, useValue: mockRefundService },
            ],
        }).compile();

        service = module.get<RidesService>(RidesService);
    });

    describe("Ownership & Authorization", () => {
        it("allows the owning rider to cancel their ride while SEARCHING_DRIVER", async () => {
            const result = await service.cancelRide(RIDE_ID, RIDER_ID, {
                reason: CancellationReason.CHANGE_OF_PLANS,
                note: "Not traveling today",
            });

            expect(result).toBeDefined();
            expect(result.status).toBe(RideStatus.CANCELLED);
            expect(result.cancellationReason).toBe(CancellationReason.CHANGE_OF_PLANS);
            expect(result.cancellationNote).toBe("Not traveling today");
            expect(result.cancelledById).toBe(RIDER_ID);
        });

        it("forbids another user from cancelling someone else's ride", async () => {
            await expect(
                service.cancelRide(RIDE_ID, OTHER_RIDER_ID, {
                    reason: CancellationReason.CHANGE_OF_PLANS,
                }),
            ).rejects.toThrow(ForbiddenException);
        });

        it("throws NotFoundException when ride does not exist", async () => {
            await expect(
                service.cancelRide("non-existent-ride", RIDER_ID),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe("Allowed Status Policy (Rider cancellation only while SEARCHING_DRIVER)", () => {
        it("rejects rider cancellation if ride is in DRIVER_ASSIGNED status", async () => {
            currentRide = buildRide(RideStatus.DRIVER_ASSIGNED);

            await expect(
                service.cancelRide(RIDE_ID, RIDER_ID),
            ).rejects.toThrow(BadRequestException);
        });

        it("rejects rider cancellation if ride is in DRIVER_ARRIVING status", async () => {
            currentRide = buildRide(RideStatus.DRIVER_ARRIVING);

            await expect(
                service.cancelRide(RIDE_ID, RIDER_ID),
            ).rejects.toThrow(BadRequestException);
        });

        it("rejects rider cancellation if ride is IN_PROGRESS", async () => {
            currentRide = buildRide(RideStatus.IN_PROGRESS);

            await expect(
                service.cancelRide(RIDE_ID, RIDER_ID),
            ).rejects.toThrow(BadRequestException);
        });

        it("rejects rider cancellation if ride is already COMPLETED", async () => {
            currentRide = buildRide(RideStatus.COMPLETED);

            await expect(
                service.cancelRide(RIDE_ID, RIDER_ID),
            ).rejects.toThrow(BadRequestException);
        });

        it("rejects rider cancellation if ride is already CANCELLED", async () => {
            currentRide = buildRide(RideStatus.CANCELLED);

            await expect(
                service.cancelRide(RIDE_ID, RIDER_ID),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe("Concurrency & Conditional DB Transitions", () => {
        it("handles concurrent driver accept race condition cleanly", async () => {
            // Simulate that while the cancel request was executing, a driver accepted the ride
            // so updateMany count is 0
            mockPrisma.ride.updateMany.mockResolvedValueOnce({ count: 0 });
            mockPrisma.ride.findUnique.mockResolvedValueOnce({
                ...currentRide,
                status: RideStatus.DRIVER_ASSIGNED,
                driverId: DRIVER_ID,
            });

            await expect(
                service.cancelRide(RIDE_ID, RIDER_ID),
            ).rejects.toThrow(BadRequestException);

            // Refund must NOT be created
            expect(mockRefundService.createRefundForRide).not.toHaveBeenCalled();
            expect(mockRefundService.processRefundJob).not.toHaveBeenCalled();
        });
    });

    describe("Durable Refund Job and In-Transaction Creation", () => {
        it("creates refund record inside the transaction and processes job outside the transaction", async () => {
            await service.cancelRide(RIDE_ID, RIDER_ID, {
                reason: CancellationReason.DRIVER_TAKING_TOO_LONG,
            });

            // Created inside transaction
            expect(mockRefundService.createRefundForRide).toHaveBeenCalledWith(
                mockPrisma,
                RIDE_ID,
                RIDER_ID,
                CancellationReason.DRIVER_TAKING_TOO_LONG,
            );

            // Processed outside transaction
            expect(mockRefundService.processRefundJob).toHaveBeenCalledWith("ref-job-1");
        });
    });

    describe("Realtime Notifications & Timeout Cancellation", () => {
        it("emits ride.updated, ride.cancelled, and clears search timeout on cancellation", async () => {
            await service.cancelRide(RIDE_ID, RIDER_ID, {
                reason: CancellationReason.ACCIDENTAL_REQUEST,
            });

            expect(mockTimeout.cancelTimer).toHaveBeenCalledWith(RIDE_ID);
            expect(mockGateway.emitRideRequestRemoved).toHaveBeenCalledWith(RIDE_ID);
            expect(mockGateway.emitRideUpdated).toHaveBeenCalled();
            expect(mockGateway.emitRideCancelled).toHaveBeenCalledWith(
                RIDER_ID,
                null,
                expect.objectContaining({
                    rideId: RIDE_ID,
                    cancellationReason: CancellationReason.ACCIDENTAL_REQUEST,
                    refund: expect.objectContaining({
                        id: "ref-1",
                        amount: 250,
                    }),
                }),
            );
        });
    });

    describe("Refund Read Endpoint Delegation", () => {
        it("delegates to RefundService for getRefund query", async () => {
            const refund = await service.getRefund(RIDE_ID, RIDER_ID, UserRole.RIDER);
            expect(refund).toBeDefined();
            expect(refund?.id).toBe("ref-1");
            expect(mockRefundService.getRefundForRide).toHaveBeenCalledWith(
                RIDE_ID,
                RIDER_ID,
                UserRole.RIDER,
            );
        });
    });
});
