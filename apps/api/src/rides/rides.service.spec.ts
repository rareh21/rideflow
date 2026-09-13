import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { RideType } from "@prisma/client";

import { RidesService } from "./rides.service";
import { PrismaService } from "../prisma/prisma.service";
import { RidesGateway } from "./rides.gateway";
import { calculateFare } from "./utils/fare-calculator";
import { haversineDistanceKm, estimatedDurationMinutes } from "./utils/location-calculator";

/*
 * Minimal location fixtures with lat/lon that produce a non-trivial distance.
 * Hyderabad–Madhapur corridor (~3.8 km straight-line).
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

async function buildService(
    prismaStub: ReturnType<typeof buildPrismaStub>,
    gatewayStub = buildGatewayStub(),
): Promise<RidesService> {
    const module: TestingModule = await Test.createTestingModule({
        providers: [
            RidesService,
            { provide: PrismaService, useValue: prismaStub },
            { provide: RidesGateway, useValue: gatewayStub },
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
// Unit tests for location-calculator (pure)
// ---------------------------------------------------------------------------
describe("estimatedDurationMinutes", () => {
    it("returns at least 1 minute for very short distances", () => {
        expect(estimatedDurationMinutes(0)).toBe(1);
        expect(estimatedDurationMinutes(0.001)).toBe(1);
    });

    it("returns ceil((distanceKm / 25) * 60)", () => {
        // 10 km / 25 km/h * 60 = 24 min
        expect(estimatedDurationMinutes(10)).toBe(24);
    });
});

// ---------------------------------------------------------------------------
// RidesService.createQuote — integration with mocked Prisma
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
// RidesService.create — server-trusted fare, client fare ignored
// ---------------------------------------------------------------------------
describe("RidesService.create", () => {
    it("creates a ride with server-calculated fare for GO type", async () => {
        const prisma = buildPrismaStub();
        const service = await buildService(prisma);

        const ride = await service.create("rider-user-uuid", {
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
            rideType: "GO",
            paymentMethod: "UPI",
        });

        const createCall = (prisma.ride.create as jest.Mock).mock.calls[0][0];
        const data = createCall.data;

        // Server must have calculated these — they must be numeric and positive
        expect(typeof data.estimatedFare).toBe("number");
        expect(data.estimatedFare).toBeGreaterThan(0);
        expect(typeof data.estimatedDistanceKm).toBe("number");
        expect(data.estimatedDistanceKm).toBeGreaterThan(0);
        expect(typeof data.estimatedDurationMinutes).toBe("number");
        expect(data.estimatedDurationMinutes).toBeGreaterThanOrEqual(1);
    });

    it("ignores any client-supplied fare — the server always recalculates", async () => {
        const prisma = buildPrismaStub();
        const service = await buildService(prisma);

        // The DTO no longer has estimatedFare — TypeScript prevents passing it.
        // This test verifies the persisted fare is server-computed, not 0 or a
        // magic number a malicious client might supply via raw HTTP.
        await service.create("rider-user-uuid", {
            pickupLocationId: PICKUP_LOCATION.id,
            destinationLocationId: DESTINATION_LOCATION.id,
            rideType: "PLUS",
            paymentMethod: "CASH",
        });

        const createCall = (prisma.ride.create as jest.Mock).mock.calls[0][0];
        const fare = createCall.data.estimatedFare;

        // Confirm it matches what the server calculator would produce
        const distanceKm = haversineDistanceKm(
            Number(PICKUP_LOCATION.latitude),
            Number(PICKUP_LOCATION.longitude),
            Number(DESTINATION_LOCATION.latitude),
            Number(DESTINATION_LOCATION.longitude),
        );
        const durationMinutes = estimatedDurationMinutes(distanceKm);
        const expectedFare = calculateFare("PLUS", distanceKm, durationMinutes);

        expect(fare).toBe(expectedFare);
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
});
