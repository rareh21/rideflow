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
        ride: {
            create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
                Promise.resolve({
                    id: "ride-uuid-1",
                    ...data,
                    pickupLocation: PICKUP_LOCATION,
                    destinationLocation: DESTINATION_LOCATION,
                }),
            ),
        },
    };
}

function buildGatewayStub() {
    return {
        emitRideUpdated: jest.fn(),
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
