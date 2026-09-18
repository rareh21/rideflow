import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";

import { RidesService } from "./rides.service";
import { PrismaService } from "../prisma/prisma.service";
import { RidesGateway } from "./rides.gateway";
import { RideTimeoutService } from "./ride-timeout.service";
import { RoutingService } from "./routing/routing.service";
import { calculateFare } from "./utils/fare-calculator";


/*
 * Minimal location fixtures with lat/lon that produce a non-trivial distance.
 * Hyderabad–Madhapur corridor.
 */
const PICKUP_LOCATION = {
    id: "pickup-uuid-1",
    label: "Kondapur",
    latitude: "17.4700",
    longitude: "78.3500",
    createdAt: new Date(),
};

const DESTINATION_LOCATION = {
    id: "destination-uuid-2",
    label: "Madhapur",
    latitude: "17.4512",
    longitude: "78.3858",
    createdAt: new Date(),
};

const RIDER_USER = {
    id: "rider-user-uuid",
};

/**
 * Fixed route data returned by the mocked RoutingService.
 * Using real-looking road values so fare assertions are deterministic.
 */
const MOCK_ROUTE = {
    distanceKm: 5.6,
    durationMinutes: 14,
    encodedPolyline: "mock_encoded_polyline",
};

/** Creates a minimal mock PrismaService for the given scenario. */
function buildPrismaStub(
    opts: {
        pickup?: typeof PICKUP_LOCATION | null;
        destination?: typeof DESTINATION_LOCATION | null;
        rider?: typeof RIDER_USER | null;
        createdRide?: Record<string, unknown>;
    } = {},
) {
    return {
        location: {
            findUnique: jest.fn().mockImplementation(
                ({ where }: { where: { id: string } }) => {
                    if (where.id === PICKUP_LOCATION.id) {
                        return Promise.resolve(
                            "pickup" in opts ? opts.pickup : PICKUP_LOCATION,
                        );
                    }
                    if (where.id === DESTINATION_LOCATION.id) {
                        return Promise.resolve(
                            "destination" in opts
                                ? opts.destination
                                : DESTINATION_LOCATION,
                        );
                    }
                    return Promise.resolve(null);
                },
            ),
        },
        user: {
            findUnique: jest.fn().mockResolvedValue(
                "rider" in opts ? opts.rider : RIDER_USER,
            ),
        },
        driver: {
            findUnique: jest.fn().mockImplementation(() =>
                Promise.resolve(
                    "driver" in opts
                        ? opts.driver
                        : {
                              id: "driver-uuid",
                              userId: "driver-user-uuid",
                              status: "AVAILABLE",
                              vehicle: { make: "Toyota", model: "Etios" },
                          },
                ),
            ),
            findFirst: jest.fn().mockResolvedValue(null),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        ride: {
            create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
                Promise.resolve({
                    id: "ride-uuid-1",
                    ...data,
                    pickupLocation: PICKUP_LOCATION,
                    destinationLocation: DESTINATION_LOCATION,
                }),
            ),
            findUnique: jest.fn().mockResolvedValue(null),
            findMany: jest.fn().mockResolvedValue([]),
            findFirst: jest.fn().mockResolvedValue(null),
            update: jest.fn().mockResolvedValue({}),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        rideReview: {
            create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
                Promise.resolve({ id: "review-1", ...data, createdAt: new Date() }),
            ),
            findUnique: jest.fn().mockResolvedValue(null),
            aggregate: jest.fn().mockResolvedValue({
                _avg: { rating: 4.5 },
                _count: { rating: 2 },
            }),
        },
        $transaction: jest.fn().mockImplementation(async (cb) => {
            if (typeof cb === "function") {
                return cb({
                    ride: {
                        update: jest.fn().mockResolvedValue({}),
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                    driver: {
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                    },
                    payment: {
                        upsert: jest.fn().mockResolvedValue({}),
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                });
            }
            return cb;
        }),
    };
}

function buildGatewayStub() {
    return {
        emitRideUpdated: jest.fn(),
        emitRideRequestCreated: jest.fn(),
        emitRideRequestRemoved: jest.fn(),
    };
}

/** Routing service stub that returns fixed route data. */
function buildRoutingStub(route = MOCK_ROUTE) {
    return {
        getRoute: jest.fn().mockResolvedValue(route),
    };
}

function buildTimeoutStub() {
    return {
        scheduleTimeout: jest.fn(),
        cancelTimer: jest.fn(),
    };
}

async function buildService(
    prismaStub: ReturnType<typeof buildPrismaStub>,
    gatewayStub = buildGatewayStub(),
    routingStub = buildRoutingStub(),
    timeoutStub = buildTimeoutStub(),
): Promise<RidesService> {
    const module: TestingModule = await Test.createTestingModule({
        providers: [
            RidesService,
            { provide: PrismaService, useValue: prismaStub },
            { provide: RidesGateway, useValue: gatewayStub },
            { provide: RoutingService, useValue: routingStub },
            { provide: RideTimeoutService, useValue: timeoutStub },
        ],
    }).compile();

    return module.get<RidesService>(RidesService);
}


// ---------------------------------------------------------------------------
// Unit tests for fare-calculator (pure, no DI needed)
// ---------------------------------------------------------------------------
describe("calculateFare", () => {
    it("calculates GO fare correctly", () => {
        // 10 km, 24 min → 50 + 10*12 + 24*1.5 = 50+120+36 = 206
        expect(calculateFare("GO", 10, 24)).toBe(206);
    });

    it("calculates PLUS fare correctly", () => {
        // 10 km, 24 min → 75 + 10*15 + 24*2 = 75+150+48 = 273
        expect(calculateFare("PLUS", 10, 24)).toBe(273);
    });

    it("calculates XL fare correctly", () => {
        // 10 km, 24 min → 100 + 10*20 + 24*2.5 = 100+200+60 = 360
        expect(calculateFare("XL", 10, 24)).toBe(360);
    });

    it("rounds the result to the nearest integer", () => {
        // baseFare=50, dist=1km@12, dur=1min@1.5 → 63.5 → rounds to 64
        expect(calculateFare("GO", 1, 1)).toBe(64);
    });
});

// ---------------------------------------------------------------------------
// RidesService.createQuote — uses routing provider, not Haversine
// ---------------------------------------------------------------------------
describe("RidesService.createQuote", () => {
    it("returns a valid quote for a GO ride between two distinct locations", async () => {
        const service = await buildService(buildPrismaStub());

        const quote = await service.createQuote({
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
            rideType: "GO",
        });

        expect(quote).toMatchObject({
            rideType: "GO",
            currency: "INR",
        });
        expect(typeof quote.estimatedDistanceKm).toBe("number");
        expect(quote.estimatedDistanceKm).toBeGreaterThan(0);
        expect(typeof quote.estimatedDurationMinutes).toBe("number");
        expect(quote.estimatedDurationMinutes).toBeGreaterThanOrEqual(1);
        expect(typeof quote.estimatedFare).toBe("number");
        expect(quote.estimatedFare).toBeGreaterThan(0);
    });

    it("quote uses road distance from routing provider (not Haversine)", async () => {
        const routing = buildRoutingStub(MOCK_ROUTE);
        const service = await buildService(buildPrismaStub(), buildGatewayStub(), routing);

        const quote = await service.createQuote({
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
            rideType: "GO",
        });

        // The routing provider must have been called
        expect(routing.getRoute).toHaveBeenCalledTimes(1);
        // Distance and duration must match what the routing provider returned
        expect(quote.estimatedDistanceKm).toBe(MOCK_ROUTE.distanceKm);
        expect(quote.estimatedDurationMinutes).toBe(MOCK_ROUTE.durationMinutes);
        // Fare must match what the fare calculator would produce from those values
        const expectedFare = calculateFare("GO", MOCK_ROUTE.distanceKm, MOCK_ROUTE.durationMinutes);
        expect(quote.estimatedFare).toBe(expectedFare);
    });

    it("includes encodedPolyline from the routing provider", async () => {
        const service = await buildService(buildPrismaStub());

        const quote = await service.createQuote({
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
            rideType: "GO",
        });

        expect(quote.encodedPolyline).toBe(MOCK_ROUTE.encodedPolyline);
    });

    it("fare varies by ride type for the same route", async () => {
        const routing = buildRoutingStub(MOCK_ROUTE);

        // Build three separate service instances to avoid mock call count bleed
        const svcGo = await buildService(buildPrismaStub(), buildGatewayStub(), buildRoutingStub(MOCK_ROUTE));
        const svcPlus = await buildService(buildPrismaStub(), buildGatewayStub(), buildRoutingStub(MOCK_ROUTE));
        const svcXl = await buildService(buildPrismaStub(), buildGatewayStub(), buildRoutingStub(MOCK_ROUTE));

        const quoteGo = await svcGo.createQuote({
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
            rideType: "GO",
        });
        const quotePlus = await svcPlus.createQuote({
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
            rideType: "PLUS",
        });
        const quoteXl = await svcXl.createQuote({
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
            rideType: "XL",
        });

        expect(quoteGo.estimatedFare).toBeLessThan(quotePlus.estimatedFare);
        expect(quotePlus.estimatedFare).toBeLessThan(quoteXl.estimatedFare);
        void routing; // suppress unused warning
    });

    it("throws NotFoundException for an invalid pickup location", async () => {
        const service = await buildService(
            buildPrismaStub({ pickup: null }),
        );

        await expect(
            service.createQuote({
                pickupLocationId: "nonexistent-pickup",
                destinationLocationId: DESTINATION_LOCATION.id,
                rideType: "GO",
            }),
        ).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException for an invalid destination location", async () => {
        const service = await buildService(
            buildPrismaStub({ destination: null }),
        );

        await expect(
            service.createQuote({
                pickupLocationId: PICKUP_LOCATION.id,
                destinationLocationId: "nonexistent-destination",
                rideType: "GO",
            }),
        ).rejects.toThrow(NotFoundException);
    });

    it("throws BadRequestException when pickup and destination are the same", async () => {
        const service = await buildService(buildPrismaStub());

        await expect(
            service.createQuote({
                pickupLocationId: PICKUP_LOCATION.id,
                destinationLocationId: PICKUP_LOCATION.id,
                rideType: "GO",
            }),
        ).rejects.toThrow(BadRequestException);
    });
});

// ---------------------------------------------------------------------------
// RidesService.createRoutePreview
// ---------------------------------------------------------------------------
describe("RidesService.createRoutePreview", () => {
    it("returns route data without a fare field", async () => {
        const service = await buildService(buildPrismaStub());

        const preview = await service.createRoutePreview({
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
        });

        expect(preview.distanceKm).toBe(MOCK_ROUTE.distanceKm);
        expect(preview.durationMinutes).toBe(MOCK_ROUTE.durationMinutes);
        expect(preview.encodedPolyline).toBe(MOCK_ROUTE.encodedPolyline);
        expect(preview.provider).toBe("google");
        // No fare on route-preview
        expect((preview as Record<string, unknown>).estimatedFare).toBeUndefined();
    });

    it("throws NotFoundException for an invalid pickup", async () => {
        const service = await buildService(buildPrismaStub({ pickup: null }));

        await expect(
            service.createRoutePreview({
                pickupLocationId: "bad-id",
                destinationLocationId: DESTINATION_LOCATION.id,
            }),
        ).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException for an invalid destination", async () => {
        const service = await buildService(buildPrismaStub({ destination: null }));

        await expect(
            service.createRoutePreview({
                pickupLocationId: PICKUP_LOCATION.id,
                destinationLocationId: "bad-id",
            }),
        ).rejects.toThrow(NotFoundException);
    });

    it("throws BadRequestException when pickup equals destination", async () => {
        const service = await buildService(buildPrismaStub());

        await expect(
            service.createRoutePreview({
                pickupLocationId: PICKUP_LOCATION.id,
                destinationLocationId: PICKUP_LOCATION.id,
            }),
        ).rejects.toThrow(BadRequestException);
    });

    it("propagates routing provider errors to the caller", async () => {
        const routing = buildRoutingStub();
        (routing.getRoute as jest.Mock).mockRejectedValue(
            new Error("Provider unavailable"),
        );

        const service = await buildService(buildPrismaStub(), buildGatewayStub(), routing);

        await expect(
            service.createRoutePreview({
                pickupLocationId: PICKUP_LOCATION.id,
                destinationLocationId: DESTINATION_LOCATION.id,
            }),
        ).rejects.toThrow("Provider unavailable");
    });
});

// ---------------------------------------------------------------------------
// RidesService.create — server-trusted fare, routing provider used
// ---------------------------------------------------------------------------
describe("RidesService.create", () => {
    it("creates a ride with server-calculated fare using road distance from routing provider", async () => {
        const routing = buildRoutingStub(MOCK_ROUTE);
        const prisma = buildPrismaStub();
        const service = await buildService(prisma, buildGatewayStub(), routing);

        await service.create("rider-user-uuid", {
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
            rideType: "GO",
            paymentMethod: "UPI",
        });

        // Routing provider must have been called
        expect(routing.getRoute).toHaveBeenCalledTimes(1);

        const createCall = (prisma.ride.create as jest.Mock).mock.calls[0][0];
        const data = createCall.data;

        // Persisted values must match routing provider output
        expect(data.estimatedDistanceKm).toBe(MOCK_ROUTE.distanceKm);
        expect(data.estimatedDurationMinutes).toBe(MOCK_ROUTE.durationMinutes);

        // Fare must match calculateFare applied to road distance
        const expectedFare = calculateFare("GO", MOCK_ROUTE.distanceKm, MOCK_ROUTE.durationMinutes);
        expect(data.estimatedFare).toBe(expectedFare);
    });

    it("fare is server-calculated from road route — client cannot override it", async () => {
        const routing = buildRoutingStub(MOCK_ROUTE);
        const prisma = buildPrismaStub();
        const service = await buildService(prisma, buildGatewayStub(), routing);

        await service.create("rider-user-uuid", {
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
            rideType: "PLUS",
            paymentMethod: "CASH",
        });

        const createCall = (prisma.ride.create as jest.Mock).mock.calls[0][0];
        const fare = createCall.data.estimatedFare;

        const expectedFare = calculateFare("PLUS", MOCK_ROUTE.distanceKm, MOCK_ROUTE.durationMinutes);

        expect(fare).toBe(expectedFare);
    });

    it("polyline is NOT persisted in the Ride record", async () => {
        const prisma = buildPrismaStub();
        const service = await buildService(prisma);

        await service.create("rider-user-uuid", {
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
            rideType: "GO",
        });

        const createCall = (prisma.ride.create as jest.Mock).mock.calls[0][0];
        const data = createCall.data as Record<string, unknown>;

        // Polyline must not be stored — it is transient
        expect(data.encodedPolyline).toBeUndefined();
        expect(data.routePolyline).toBeUndefined();
    });

    it("persists the selected payment method", async () => {
        const prisma = buildPrismaStub();
        const service = await buildService(prisma);

        await service.create("rider-user-uuid", {
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
            rideType: "GO",
            paymentMethod: "CARD",
        });

        const createCall = (prisma.ride.create as jest.Mock).mock.calls[0][0];
        expect(createCall.data.paymentMethod).toBe("CARD");
    });

    it("sets status to SEARCHING_DRIVER on creation", async () => {
        const prisma = buildPrismaStub();
        const service = await buildService(prisma);

        await service.create("rider-user-uuid", {
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
            rideType: "XL",
        });

        const createCall = (prisma.ride.create as jest.Mock).mock.calls[0][0];
        expect(createCall.data.status).toBe("SEARCHING_DRIVER");
    });

    it("throws NotFoundException for an unknown rider", async () => {
        const service = await buildService(buildPrismaStub({ rider: null }));

        await expect(
            service.create("unknown-rider", {
                pickupLocationId: PICKUP_LOCATION.id,
                destinationLocationId: DESTINATION_LOCATION.id,
                rideType: "GO",
            }),
        ).rejects.toThrow(NotFoundException);
    });

    it("throws BadRequestException when pickup equals destination", async () => {
        const service = await buildService(buildPrismaStub());

        await expect(
            service.create("rider-user-uuid", {
                pickupLocationId: PICKUP_LOCATION.id,
                destinationLocationId: PICKUP_LOCATION.id,
                rideType: "GO",
            }),
        ).rejects.toThrow(BadRequestException);
    });

    it("calls routing provider with correct lat/lng derived from location records", async () => {
        const routing = buildRoutingStub(MOCK_ROUTE);
        const prisma = buildPrismaStub();
        const service = await buildService(prisma, buildGatewayStub(), routing);

        await service.create("rider-user-uuid", {
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
            rideType: "GO",
        });

        expect(routing.getRoute).toHaveBeenCalledWith(
            {
                latitude: Number(PICKUP_LOCATION.latitude),
                longitude: Number(PICKUP_LOCATION.longitude),
            },
            {
                latitude: Number(DESTINATION_LOCATION.latitude),
                longitude: Number(DESTINATION_LOCATION.longitude),
            },
        );
    });
});

// ── Batch 4: Driver Requests & Acceptance ──────────────────────────────────
describe("RidesService — getAvailableRideRequests", () => {
    it("returns available requests for an AVAILABLE driver", async () => {
        const prisma = buildPrismaStub();
        (prisma.driver.findUnique as jest.Mock).mockResolvedValue({
            id: "driver-uuid",
            status: "AVAILABLE",
            vehicle: { make: "Toyota", model: "Camry" },
        });
        (prisma.ride.findMany as jest.Mock).mockResolvedValue([
            { id: "ride-1", status: "SEARCHING_DRIVER", driverId: null },
        ]);

        const service = await buildService(prisma);
        const results = await service.getAvailableRideRequests("driver-user-uuid");

        expect(results).toHaveLength(1);
        expect(prisma.ride.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    status: "SEARCHING_DRIVER",
                    driverId: null,
                }),
            }),
        );
    });

    it("returns empty array if driver is OFFLINE or BUSY", async () => {
        const prisma = buildPrismaStub();
        (prisma.driver.findUnique as jest.Mock).mockResolvedValue({
            id: "driver-uuid",
            status: "BUSY",
            vehicle: { make: "Toyota", model: "Camry" },
        });

        const service = await buildService(prisma);
        const results = await service.getAvailableRideRequests("driver-user-uuid");

        expect(results).toEqual([]);
        expect(prisma.ride.findMany).not.toHaveBeenCalled();
    });
});

describe("RidesService — acceptRide", () => {
    it("successfully accepts ride for an AVAILABLE driver", async () => {
        const prisma = buildPrismaStub();
        const gateway = buildGatewayStub();
        (prisma.driver.findUnique as jest.Mock).mockResolvedValue({
            id: "driver-uuid",
            status: "AVAILABLE",
            vehicle: { make: "Toyota", model: "Etios" },
        });
        (prisma.ride.findUnique as jest.Mock).mockResolvedValue({ rideType: "GO" });
        (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
            const tx = {
                driver: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
                ride: {
                    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                    findUnique: jest.fn().mockResolvedValue({
                        id: "ride-1",
                        status: "DRIVER_ASSIGNED",
                        driverId: "driver-uuid",
                        riderId: "rider-uuid",
                    }),
                },
            };
            return cb(tx);
        });

        const service = await buildService(prisma, gateway);
        const result = await service.acceptRide("ride-1", "driver-user-uuid");

        expect(result.accepted).toBe(true);
        expect(result.ride?.status).toBe("DRIVER_ASSIGNED");
        expect(gateway.emitRideRequestRemoved).toHaveBeenCalledWith("ride-1");
    });

    it("rejects acceptance if driver is NOT AVAILABLE", async () => {
        const prisma = buildPrismaStub();
        (prisma.driver.findUnique as jest.Mock).mockResolvedValue({
            id: "driver-uuid",
            status: "BUSY",
            vehicle: { make: "Toyota", model: "Etios" },
        });

        const service = await buildService(prisma);
        await expect(service.acceptRide("ride-1", "driver-user-uuid")).rejects.toThrow(BadRequestException);
    });
});

// ── Batch 5: Driver Ride Execution ──────────────────────────────────────────
describe("RidesService — getDriverCurrentRide", () => {
    it("returns current active ride for an authenticated driver", async () => {
        const prisma = buildPrismaStub();
        (prisma.driver.findUnique as jest.Mock).mockResolvedValue({ id: "driver-uuid" });
        (prisma.ride.findFirst as jest.Mock).mockResolvedValue({
            id: "ride-active-1",
            status: "DRIVER_ARRIVING",
            driverId: "driver-uuid",
            pickupLocation: PICKUP_LOCATION,
            destinationLocation: DESTINATION_LOCATION,
        });

        const service = await buildService(prisma);
        const currentRide = await service.getDriverCurrentRide("driver-user-uuid");

        expect(currentRide).toMatchObject({
            id: "ride-active-1",
            status: "DRIVER_ARRIVING",
        });
        expect(prisma.ride.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    driverId: "driver-uuid",
                    status: {
                        in: ["DRIVER_ASSIGNED", "DRIVER_ARRIVING", "DRIVER_ARRIVED", "IN_PROGRESS"],
                    },
                }),
            }),
        );
    });

    it("returns null if driver has no active ride", async () => {
        const prisma = buildPrismaStub();
        (prisma.driver.findUnique as jest.Mock).mockResolvedValue({ id: "driver-uuid" });
        (prisma.ride.findFirst as jest.Mock).mockResolvedValue(null);

        const service = await buildService(prisma);
        const result = await service.getDriverCurrentRide("driver-user-uuid");

        expect(result).toBeNull();
    });

    it("throws NotFoundException if driver profile is missing", async () => {
        const prisma = buildPrismaStub({ driver: null });

        const service = await buildService(prisma);
        await expect(service.getDriverCurrentRide("unknown-user")).rejects.toThrow(NotFoundException);
    });
});

describe("RidesService — updateStatus (Batch 5 Lifecycle & Completion)", () => {
    it("transitions DRIVER_ASSIGNED -> DRIVER_ARRIVING and emits ride.updated", async () => {
        const prisma = buildPrismaStub();
        const gateway = buildGatewayStub();
        (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
            id: "ride-1",
            status: "DRIVER_ASSIGNED",
            riderId: "rider-uuid",
            driverId: "driver-uuid",
            driver: { id: "driver-uuid", userId: "driver-user-uuid", status: "BUSY" },
        });
        (prisma.ride.update as jest.Mock).mockResolvedValue({
            id: "ride-1",
            status: "DRIVER_ARRIVING",
            riderId: "rider-uuid",
            driverId: "driver-uuid",
            driver: { id: "driver-uuid", userId: "driver-user-uuid", status: "BUSY" },
        });

        const service = await buildService(prisma, gateway);
        const updated = await service.updateStatus("ride-1", "driver-user-uuid", "DRIVER_ARRIVING");

        expect(updated.status).toBe("DRIVER_ARRIVING");
        expect(gateway.emitRideUpdated).toHaveBeenCalledWith("rider-uuid", "driver-user-uuid", expect.anything());
    });

    it("transitions DRIVER_ARRIVING -> DRIVER_ARRIVED and emits ride.updated", async () => {
        const prisma = buildPrismaStub();
        const gateway = buildGatewayStub();
        (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
            id: "ride-1",
            status: "DRIVER_ARRIVING",
            riderId: "rider-uuid",
            driverId: "driver-uuid",
            driver: { id: "driver-uuid", userId: "driver-user-uuid", status: "BUSY" },
        });
        (prisma.ride.update as jest.Mock).mockResolvedValue({
            id: "ride-1",
            status: "DRIVER_ARRIVED",
            riderId: "rider-uuid",
            driverId: "driver-uuid",
            driver: { id: "driver-uuid", userId: "driver-user-uuid", status: "BUSY" },
        });

        const service = await buildService(prisma, gateway);
        const updated = await service.updateStatus("ride-1", "driver-user-uuid", "DRIVER_ARRIVED");

        expect(updated.status).toBe("DRIVER_ARRIVED");
        expect(gateway.emitRideUpdated).toHaveBeenCalledWith("rider-uuid", "driver-user-uuid", expect.anything());
    });

    it("transitions DRIVER_ARRIVED -> IN_PROGRESS for assigned driver", async () => {
        const prisma = buildPrismaStub();
        const gateway = buildGatewayStub();
        (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
            id: "ride-1",
            status: "DRIVER_ARRIVED",
            riderId: "rider-uuid",
            driverId: "driver-uuid",
            driver: { id: "driver-uuid", userId: "driver-user-uuid", status: "BUSY" },
        });
        (prisma.ride.update as jest.Mock).mockResolvedValue({
            id: "ride-1",
            status: "IN_PROGRESS",
            riderId: "rider-uuid",
            driverId: "driver-uuid",
            driver: { id: "driver-uuid", userId: "driver-user-uuid", status: "BUSY" },
        });

        const service = await buildService(prisma, gateway);
        const updated = await service.updateStatus("ride-1", "driver-user-uuid", "IN_PROGRESS");

        expect(updated.status).toBe("IN_PROGRESS");
    });

    it("atomically completes ride and sets driver to AVAILABLE on COMPLETED", async () => {
        const prisma = buildPrismaStub();
        const gateway = buildGatewayStub();

        (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
            id: "ride-1",
            status: "IN_PROGRESS",
            riderId: "rider-uuid",
            driverId: "driver-uuid",
            driver: { id: "driver-uuid", userId: "driver-user-uuid", status: "BUSY" },
        });

        (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
            const tx = {
                ride: {
                    update: jest.fn().mockResolvedValue({
                        id: "ride-1",
                        status: "COMPLETED",
                        riderId: "rider-uuid",
                        driverId: "driver-uuid",
                        driver: { id: "driver-uuid", userId: "driver-user-uuid", status: "AVAILABLE" },
                    }),
                },
                driver: {
                    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                },
                payment: {
                    upsert: jest.fn().mockResolvedValue({}),
                    findUnique: jest.fn().mockResolvedValue(null),
                },
            };
            return cb(tx);
        });

        const service = await buildService(prisma, gateway);
        const updated = await service.updateStatus("ride-1", "driver-user-uuid", "COMPLETED");

        expect(updated.status).toBe("COMPLETED");
        expect(gateway.emitRideUpdated).toHaveBeenCalledWith("rider-uuid", "driver-user-uuid", expect.anything());
    });

    it("rejects transition attempt by an unassigned driver", async () => {
        const prisma = buildPrismaStub();
        (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
            id: "ride-1",
            status: "DRIVER_ASSIGNED",
            riderId: "rider-uuid",
            driverId: "driver-uuid",
            driver: { id: "driver-uuid", userId: "driver-user-uuid", status: "BUSY" },
        });

        const service = await buildService(prisma);
        await expect(
            service.updateStatus("ride-1", "other-driver-user-uuid", "DRIVER_ARRIVING"),
        ).rejects.toThrow();
    });
});

// ── Batch 6: Post-Ride Completion & Receipt ───────────────────────────────
describe("RidesService — getReceipt (Batch 6)", () => {
    it("allows rider owner to retrieve completed ride receipt", async () => {
        const prisma = buildPrismaStub();
        const now = new Date();
        (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
            id: "ride-1",
            riderId: "rider-user-uuid",
            driverId: "driver-uuid",
            rideType: "GO",
            status: "COMPLETED",
            estimatedFare: "245.00",
            estimatedDistanceKm: "14.80",
            estimatedDurationMinutes: 32,
            paymentMethod: "UPI",
            pickupLocation: PICKUP_LOCATION,
            destinationLocation: DESTINATION_LOCATION,
            rider: { id: "rider-user-uuid", name: "Rider User", email: "rider@example.com" },
            driver: { id: "driver-uuid", userId: "driver-user-uuid", status: "AVAILABLE", user: { id: "driver-user-uuid", name: "Driver User" }, vehicle: null },
            createdAt: now,
            updatedAt: now,
            completedAt: now,
        });

        const service = await buildService(prisma);
        const receipt = await service.getReceipt("ride-1", "rider-user-uuid");

        expect(receipt).toMatchObject({
            rideId: "ride-1",
            status: "COMPLETED",
            rideType: "GO",
            distanceKm: 14.8,
            durationMinutes: 32,
            fare: 245,
            currency: "INR",
            paymentMethod: "UPI",
        });
        expect(receipt.pickupLocation).toEqual(PICKUP_LOCATION);
        expect(receipt.destinationLocation).toEqual(DESTINATION_LOCATION);
    });

    it("allows assigned driver to retrieve completed ride receipt", async () => {
        const prisma = buildPrismaStub();
        const now = new Date();
        (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
            id: "ride-1",
            riderId: "rider-user-uuid",
            driverId: "driver-uuid",
            rideType: "PLUS",
            status: "COMPLETED",
            estimatedFare: "350.00",
            estimatedDistanceKm: "20.00",
            estimatedDurationMinutes: 40,
            paymentMethod: "CARD",
            pickupLocation: PICKUP_LOCATION,
            destinationLocation: DESTINATION_LOCATION,
            rider: { id: "rider-user-uuid", name: "Rider User", email: "rider@example.com" },
            driver: { id: "driver-uuid", userId: "driver-user-uuid", status: "AVAILABLE", user: { id: "driver-user-uuid", name: "Driver User" }, vehicle: null },
            createdAt: now,
            updatedAt: now,
            completedAt: now,
        });

        const service = await buildService(prisma);
        const receipt = await service.getReceipt("ride-1", "driver-user-uuid");

        expect(receipt.rideId).toBe("ride-1");
        expect(receipt.fare).toBe(350);
        expect(receipt.paymentMethod).toBe("CARD");
    });

    it("rejects unrelated rider with ForbiddenException", async () => {
        const prisma = buildPrismaStub();
        (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
            id: "ride-1",
            riderId: "rider-user-uuid",
            driverId: "driver-uuid",
            driver: { id: "driver-uuid", userId: "driver-user-uuid" },
        });

        const service = await buildService(prisma);
        await expect(service.getReceipt("ride-1", "other-rider-uuid")).rejects.toThrow("You do not have access to this ride");
    });

    it("rejects unrelated driver with ForbiddenException", async () => {
        const prisma = buildPrismaStub();
        (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
            id: "ride-1",
            riderId: "rider-user-uuid",
            driverId: "driver-uuid",
            driver: { id: "driver-uuid", userId: "driver-user-uuid" },
        });

        const service = await buildService(prisma);
        await expect(service.getReceipt("ride-1", "other-driver-user-uuid")).rejects.toThrow("You do not have access to this ride");
    });

    it("defaults payment method to UPI if none is specified", async () => {
        const prisma = buildPrismaStub();
        (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
            id: "ride-1",
            riderId: "rider-user-uuid",
            driverId: "driver-uuid",
            rideType: "GO",
            status: "COMPLETED",
            estimatedFare: "100.00",
            estimatedDistanceKm: "5.00",
            estimatedDurationMinutes: 15,
            paymentMethod: null,
            pickupLocation: PICKUP_LOCATION,
            destinationLocation: DESTINATION_LOCATION,
            rider: { id: "rider-user-uuid" },
            driver: { id: "driver-uuid", userId: "driver-user-uuid" },
        });

        const service = await buildService(prisma);
        const receipt = await service.getReceipt("ride-1", "rider-user-uuid");

        expect(receipt.paymentMethod).toBe("UPI");
    });

    describe("createReview, getReview, and getUserRatingSummary", () => {
        it("allows rider to review a completed ride", async () => {
            const prisma = buildPrismaStub();
            (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
                id: "ride-1",
                status: "COMPLETED",
                riderId: "rider-user-uuid",
                driverId: "driver-uuid",
                driver: { userId: "driver-user-uuid" },
            });

            const service = await buildService(prisma);
            const review = await service.createReview("rider-user-uuid", "ride-1", {
                rating: 5,
                comment: "Excellent drive!",
            });

            expect(review.rating).toBe(5);
            expect(review.comment).toBe("Excellent drive!");
            expect(review.reviewerId).toBe("rider-user-uuid");
            expect(review.revieweeId).toBe("driver-user-uuid");
        });

        it("allows driver to review a completed ride", async () => {
            const prisma = buildPrismaStub();
            (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
                id: "ride-1",
                status: "COMPLETED",
                riderId: "rider-user-uuid",
                driverId: "driver-uuid",
                driver: { userId: "driver-user-uuid" },
            });

            const service = await buildService(prisma);
            const review = await service.createReview("driver-user-uuid", "ride-1", {
                rating: 4,
            });

            expect(review.rating).toBe(4);
            expect(review.reviewerId).toBe("driver-user-uuid");
            expect(review.revieweeId).toBe("rider-user-uuid");
        });

        it("rejects review if ride is not completed", async () => {
            const prisma = buildPrismaStub();
            (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
                id: "ride-1",
                status: "IN_PROGRESS",
                riderId: "rider-user-uuid",
                driverId: "driver-uuid",
                driver: { userId: "driver-user-uuid" },
            });

            const service = await buildService(prisma);
            await expect(
                service.createReview("rider-user-uuid", "ride-1", { rating: 5 }),
            ).rejects.toThrow("This ride cannot be reviewed until it is completed.");
        });

        it("rejects review if user did not participate in the ride", async () => {
            const prisma = buildPrismaStub();
            (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
                id: "ride-1",
                status: "COMPLETED",
                riderId: "rider-user-uuid",
                driverId: "driver-uuid",
                driver: { userId: "driver-user-uuid" },
            });

            const service = await buildService(prisma);
            await expect(
                service.createReview("other-user-uuid", "ride-1", { rating: 5 }),
            ).rejects.toThrow("You can only review rides you participated in.");
        });

        it("rejects rider review if completed ride has no driver", async () => {
            const prisma = buildPrismaStub();
            (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
                id: "ride-1",
                status: "COMPLETED",
                riderId: "rider-user-uuid",
                driverId: null,
                driver: null,
            });

            const service = await buildService(prisma);
            await expect(
                service.createReview("rider-user-uuid", "ride-1", { rating: 5 }),
            ).rejects.toThrow("This ride does not have an assigned driver to review.");
        });

        it("rejects duplicate review submission", async () => {
            const prisma = buildPrismaStub();
            (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
                id: "ride-1",
                status: "COMPLETED",
                riderId: "rider-user-uuid",
                driverId: "driver-uuid",
                driver: { userId: "driver-user-uuid" },
            });
            (prisma.rideReview.findUnique as jest.Mock).mockResolvedValue({
                id: "existing-review-uuid",
                rating: 5,
            });

            const service = await buildService(prisma);
            await expect(
                service.createReview("rider-user-uuid", "ride-1", { rating: 5 }),
            ).rejects.toThrow("You have already reviewed this ride.");
        });

        it("returns user's existing review or null", async () => {
            const prisma = buildPrismaStub();
            (prisma.rideReview.findUnique as jest.Mock).mockResolvedValueOnce({
                id: "review-1",
                rating: 5,
                comment: "Great",
            }).mockResolvedValueOnce(null);

            const service = await buildService(prisma);
            const found = await service.getReview("rider-user-uuid", "ride-1");
            expect(found?.rating).toBe(5);

            const missing = await service.getReview("rider-user-uuid", "ride-2");
            expect(missing).toBeNull();
        });

        it("calculates aggregate rating correctly", async () => {
            const prisma = buildPrismaStub();
            (prisma.rideReview.aggregate as jest.Mock).mockResolvedValue({
                _avg: { rating: 4.766 },
                _count: { rating: 128 },
            });

            const service = await buildService(prisma);
            const summary = await service.getUserRatingSummary("target-user-uuid");

            expect(summary.averageRating).toBe(4.8);
            expect(summary.totalRatings).toBe(128);
        });

        it("returns null averageRating if no ratings exist", async () => {
            const prisma = buildPrismaStub();
            (prisma.rideReview.aggregate as jest.Mock).mockResolvedValue({
                _avg: { rating: null },
                _count: { rating: 0 },
            });

            const service = await buildService(prisma);
            const summary = await service.getUserRatingSummary("target-user-uuid");

            expect(summary.averageRating).toBeNull();
            expect(summary.totalRatings).toBe(0);
        });
    });
});

