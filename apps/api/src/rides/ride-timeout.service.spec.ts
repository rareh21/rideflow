import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { RideStatus } from "@prisma/client";

import { RideTimeoutService } from "./ride-timeout.service";
import { PrismaService } from "../prisma/prisma.service";
import { RidesGateway } from "./rides.gateway";

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
    };
}

/* ── Tests ──────────────────────────────────────────────────────────────── */

describe("RideTimeoutService", () => {
    let service: RideTimeoutService;
    let prisma: ReturnType<typeof buildPrismaStub>;
    let gateway: ReturnType<typeof buildGatewayStub>;

    beforeEach(async () => {
        jest.useFakeTimers();

        // Silence logger output during tests.
        jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
        jest.spyOn(Logger.prototype, "debug").mockImplementation(() => undefined);
        jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

        prisma = buildPrismaStub();
        gateway = buildGatewayStub();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RideTimeoutService,
                { provide: PrismaService, useValue: prisma },
                { provide: RidesGateway, useValue: gateway },
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

            jest.advanceTimersByTime(119_000); // 1 s short of 120 s default

            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it("runs the Prisma transaction once the timeout elapses", async () => {
            service.scheduleTimeout(RIDE_ID);

            jest.runAllTimers();
            // Allow the async expireRide callback to resolve.
            await Promise.resolve();
            await Promise.resolve();

            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        });

        it("emits ride.updated via the gateway when the ride is cancelled", async () => {
            service.scheduleTimeout(RIDE_ID);

            jest.runAllTimers();
            await Promise.resolve();
            await Promise.resolve();

            expect(gateway.emitRideUpdated).toHaveBeenCalledWith(
                RIDER_ID,
                null,
                expect.objectContaining({
                    rideId: RIDE_ID,
                    status: RideStatus.CANCELLED,
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
                ],
            }).compile();

            const svc = module.get(RideTimeoutService);
            svc.scheduleTimeout(RIDE_ID);

            jest.runAllTimers();
            await Promise.resolve();
            await Promise.resolve();

            expect(gateway.emitRideUpdated).not.toHaveBeenCalled();
        });

        it("replaces an existing timer when called twice for the same rideId", async () => {
            service.scheduleTimeout(RIDE_ID);
            service.scheduleTimeout(RIDE_ID); // second call resets the timer

            jest.runAllTimers();
            await Promise.resolve();
            await Promise.resolve();

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
            await Promise.resolve();
            await Promise.resolve();

            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it("is a no-op when called for an unknown rideId (no error thrown)", () => {
            expect(() =>
                service.cancelTimer("unknown-ride-id"),
            ).not.toThrow();
        });

        it("does not affect a timer for a different rideId", async () => {
            service.scheduleTimeout(RIDE_ID);
            service.scheduleTimeout("other-ride-id");

            service.cancelTimer(RIDE_ID);

            jest.runAllTimers();
            await Promise.resolve();
            await Promise.resolve();

            // The other-ride timer should still fire.
            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        });
    });
});
