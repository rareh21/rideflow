import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { CancellationReason, RideStatus } from "@prisma/client";

import { RideTimeoutService } from "./ride-timeout.service";
import { PrismaService } from "../prisma/prisma.service";
import { RidesGateway } from "./rides.gateway";
import { RefundService } from "../payment/refund.service";

/* ── Helpers ───────────────────────────────────────────────────────────── */

const RIDE_ID = "ride-uuid-1";
const RIDER_ID = "rider-uuid-1";

function buildCancelledRide() {
    return {
        id: RIDE_ID,
        riderId: RIDER_ID,
        status: RideStatus.CANCELLED,
        driverId: null,
        driver: null,
        cancellationReason: CancellationReason.DRIVER_UNAVAILABLE,
        cancelledAt: new Date(),
        pickupLocation: {},
        destinationLocation: {},
        rider: { id: RIDER_ID, name: "Alice", email: "alice@example.com" },
    };
}

/* ── Mocks ─────────────────────────────────────────────────────────────── */

function buildPrismaStub(opts: {
    updateManyCount?: number;
    findUniqueResult?: Record<string, unknown> | null;
} = {}) {
    const { updateManyCount = 1, findUniqueResult = buildCancelledRide() } = opts;

    return {
        $transaction: jest.fn().mockImplementation(
            async (fn: (tx: unknown) => Promise<unknown>) => fn({
                ride: {
                    updateMany: jest.fn().mockResolvedValue({ count: updateManyCount }),
                    findUnique: jest.fn().mockResolvedValue(findUniqueResult),
                },
            }),
        ),
    };
}

function buildGatewayStub() {
    return {
        emitRideUpdated: jest.fn(),
        emitRideCancelled: jest.fn(),
        emitRideRequestRemoved: jest.fn(),
    };
}

function buildRefundStub() {
    return {
        createRefundForRide: jest.fn().mockResolvedValue(null),
        processRefundJob: jest.fn().mockResolvedValue(undefined),
    };
}

const flushPromises = async () => {
    for (let i = 0; i < 10; i++) {
        await Promise.resolve();
    }
};

/* ── Tests ──────────────────────────────────────────────────────────────── */

describe("RideTimeoutService", () => {
    let service: RideTimeoutService;
    let prisma: ReturnType<typeof buildPrismaStub>;
    let gateway: ReturnType<typeof buildGatewayStub>;
    let refund: ReturnType<typeof buildRefundStub>;

    beforeEach(async () => {
        jest.useFakeTimers();

        // Silence logger output during tests.
        jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
        jest.spyOn(Logger.prototype, "debug").mockImplementation(() => undefined);
        jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

        prisma = buildPrismaStub();
        gateway = buildGatewayStub();
        refund = buildRefundStub();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RideTimeoutService,
                { provide: PrismaService, useValue: prisma },
                { provide: RidesGateway, useValue: gateway },
                { provide: RefundService, useValue: refund },
            ],
        }).compile();

        service = module.get(RideTimeoutService);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    /* ── scheduleTimeout ─────────────────────────────────────────────── */

    describe("scheduleTimeout", () => {
        it("does not cancel immediately — waits for the timeout window", () => {
            service.scheduleTimeout(RIDE_ID);

            // Advance less than the 2-minute default (119 seconds).
            jest.advanceTimersByTime(119_000);

            expect(prisma.$transaction).not.toHaveBeenCalled();
            expect(gateway.emitRideUpdated).not.toHaveBeenCalled();
        });

        it("cancels the ride when the timeout window elapses", async () => {
            service.scheduleTimeout(RIDE_ID);

            jest.runAllTimers();
            await flushPromises();

            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        });

        it("emits ride.updated and ride.cancelled via the gateway when the ride is cancelled", async () => {
            service.scheduleTimeout(RIDE_ID);

            jest.runAllTimers();
            await flushPromises();

            expect(gateway.emitRideUpdated).toHaveBeenCalledWith(
                RIDER_ID,
                null,
                expect.objectContaining({
                    rideId: RIDE_ID,
                    status: RideStatus.CANCELLED,
                }),
            );

            expect(gateway.emitRideCancelled).toHaveBeenCalledWith(
                RIDER_ID,
                null,
                expect.objectContaining({
                    rideId: RIDE_ID,
                    cancellationReason: CancellationReason.DRIVER_UNAVAILABLE,
                }),
            );
        });

        it("does NOT emit when the ride was already accepted (updateMany count = 0)", async () => {
            prisma = buildPrismaStub({ updateManyCount: 0 });

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    RideTimeoutService,
                    { provide: PrismaService, useValue: prisma },
                    { provide: RidesGateway, useValue: gateway },
                    { provide: RefundService, useValue: refund },
                ],
            }).compile();

            const svc = module.get(RideTimeoutService);
            svc.scheduleTimeout(RIDE_ID);

            jest.runAllTimers();
            await flushPromises();

            expect(gateway.emitRideUpdated).not.toHaveBeenCalled();
        });

        it("replaces an existing timer when called twice for the same rideId", async () => {
            service.scheduleTimeout(RIDE_ID);
            service.scheduleTimeout(RIDE_ID); // second call resets the timer

            jest.runAllTimers();
            await flushPromises();

            // Should only fire once even though we scheduled twice.
            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        });
    });

    /* ── cancelTimer ──────────────────────────────────────────────────── */

    describe("cancelTimer", () => {
        it("prevents the transaction from running when called before the timer fires", async () => {
            service.scheduleTimeout(RIDE_ID);
            service.cancelTimer(RIDE_ID);

            jest.runAllTimers();
            await flushPromises();

            expect(prisma.$transaction).not.toHaveBeenCalled();
            expect(gateway.emitRideUpdated).not.toHaveBeenCalled();
        });

        it("is safe to call for a ride that has no active timer", () => {
            expect(() => service.cancelTimer("non-existent-ride")).not.toThrow();
        });

        it("is safe to call multiple times for the same rideId", () => {
            service.scheduleTimeout(RIDE_ID);
            service.cancelTimer(RIDE_ID);
            expect(() => service.cancelTimer(RIDE_ID)).not.toThrow();
        });
    });
});
