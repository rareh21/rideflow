import { Test, TestingModule } from "@nestjs/testing";
import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
} from "@nestjs/common";

import { DriverLocationService } from "./driver-location.service";
import { PrismaService } from "../../prisma/prisma.service";
import { RidesGateway } from "../../rides/rides.gateway";
import { RideStatus } from "@prisma/client";

const DRIVER_USER_ID = "driver-user-uuid-1";
const DRIVER_ID = "driver-uuid-1";
const RIDER_USER_ID = "rider-user-uuid-1";
const RIDE_ID = "ride-uuid-1";

function buildPrismaStub(opts: {
    driver?: Record<string, unknown> | null;
    activeRide?: Record<string, unknown> | null;
    ride?: Record<string, unknown> | null;
    location?: Record<string, unknown> | null;
} = {}) {
    return {
        driver: {
            findUnique: jest.fn().mockImplementation(({ where }: { where: { userId: string } }) => {
                if (where.userId === DRIVER_USER_ID) {
                    return Promise.resolve(
                        "driver" in opts ? opts.driver : { id: DRIVER_ID, userId: DRIVER_USER_ID },
                    );
                }
                return Promise.resolve(null);
            }),
        },
        ride: {
            findFirst: jest.fn().mockImplementation(() =>
                Promise.resolve(
                    "activeRide" in opts
                        ? opts.activeRide
                        : {
                            id: RIDE_ID,
                            riderId: RIDER_USER_ID,
                            driverId: DRIVER_ID,
                            status: RideStatus.DRIVER_ASSIGNED,
                        },
                ),
            ),
            findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
                if (where.id === RIDE_ID) {
                    return Promise.resolve(
                        "ride" in opts
                            ? opts.ride
                            : {
                                id: RIDE_ID,
                                riderId: RIDER_USER_ID,
                                driverId: DRIVER_ID,
                                status: RideStatus.DRIVER_ASSIGNED,
                                driver: { id: DRIVER_ID, userId: DRIVER_USER_ID },
                            },
                    );
                }
                return Promise.resolve(null);
            }),
        },
        driverLocation: {
            upsert: jest.fn().mockImplementation(({ create, update }) =>
                Promise.resolve({
                    id: "loc-uuid-1",
                    driverId: DRIVER_ID,
                    latitude: create.latitude,
                    longitude: create.longitude,
                    heading: create.heading,
                    speedKmh: create.speedKmh,
                    accuracyM: create.accuracyM,
                    updatedAt: new Date("2026-09-18T10:00:00.000Z"),
                    createdAt: new Date("2026-09-18T10:00:00.000Z"),
                }),
            ),
            findUnique: jest.fn().mockImplementation(({ where }: { where: { driverId: string } }) => {
                if (where.driverId === DRIVER_ID) {
                    return Promise.resolve(
                        "location" in opts
                            ? opts.location
                            : {
                                id: "loc-uuid-1",
                                driverId: DRIVER_ID,
                                latitude: "17.3850",
                                longitude: "78.4867",
                                heading: "90",
                                speedKmh: "32",
                                accuracyM: "8",
                                updatedAt: new Date("2026-09-18T10:00:00.000Z"),
                                createdAt: new Date("2026-09-18T10:00:00.000Z"),
                            },
                    );
                }
                return Promise.resolve(null);
            }),
        },
    };
}

function buildGatewayStub() {
    return {
        emitDriverLocationUpdated: jest.fn(),
    };
}

describe("DriverLocationService", () => {
    let service: DriverLocationService;
    let prismaStub: ReturnType<typeof buildPrismaStub>;
    let gatewayStub: ReturnType<typeof buildGatewayStub>;

    beforeEach(async () => {
        prismaStub = buildPrismaStub();
        gatewayStub = buildGatewayStub();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DriverLocationService,
                { provide: PrismaService, useValue: prismaStub },
                { provide: RidesGateway, useValue: gatewayStub },
            ],
        }).compile();

        service = module.get<DriverLocationService>(DriverLocationService);
    });

    it("driver can update own location and upserts database record", async () => {
        const dto = {
            latitude: 17.385,
            longitude: 78.4867,
            heading: 90,
            speedKmh: 32,
            accuracyM: 8,
        };

        const result = await service.updateDriverLocation(DRIVER_USER_ID, dto);

        expect(result).toMatchObject({
            latitude: 17.385,
            longitude: 78.4867,
            heading: 90,
            speedKmh: 32,
            accuracyM: 8,
        });

        expect(prismaStub.driverLocation.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { driverId: DRIVER_ID },
                create: expect.objectContaining({
                    driverId: DRIVER_ID,
                    latitude: 17.385,
                    longitude: 78.4867,
                }),
            }),
        );
    });

    it("emits realtime driver.location.updated event after successful update", async () => {
        const dto = {
            latitude: 17.385,
            longitude: 78.4867,
            heading: 90,
            speedKmh: 32,
            accuracyM: 8,
        };

        await service.updateDriverLocation(DRIVER_USER_ID, dto);

        expect(gatewayStub.emitDriverLocationUpdated).toHaveBeenCalledWith(
            RIDER_USER_ID,
            DRIVER_USER_ID,
            expect.objectContaining({
                rideId: RIDE_ID,
                driverId: DRIVER_ID,
                location: expect.objectContaining({
                    latitude: 17.385,
                    longitude: 78.4867,
                    heading: 90,
                    speedKmh: 32,
                    accuracyM: 8,
                }),
            }),
        );
    });

    it("throws ForbiddenException when updating location if user is not an active driver", async () => {
        prismaStub = buildPrismaStub({ driver: null });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DriverLocationService,
                { provide: PrismaService, useValue: prismaStub },
                { provide: RidesGateway, useValue: gatewayStub },
            ],
        }).compile();

        const svc = module.get<DriverLocationService>(DriverLocationService);

        await expect(
            svc.updateDriverLocation("non-driver-user", { latitude: 17.385, longitude: 78.4867 }),
        ).rejects.toThrow(ForbiddenException);
    });

    it("completed ride does not accept location updates", async () => {
        prismaStub = buildPrismaStub({ activeRide: null });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DriverLocationService,
                { provide: PrismaService, useValue: prismaStub },
                { provide: RidesGateway, useValue: gatewayStub },
            ],
        }).compile();

        const svc = module.get<DriverLocationService>(DriverLocationService);

        await expect(
            svc.updateDriverLocation(DRIVER_USER_ID, { latitude: 17.385, longitude: 78.4867 }),
        ).rejects.toThrow(BadRequestException);
    });

    it("cancelled ride does not accept location updates", async () => {
        prismaStub = buildPrismaStub({ activeRide: null });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DriverLocationService,
                { provide: PrismaService, useValue: prismaStub },
                { provide: RidesGateway, useValue: gatewayStub },
            ],
        }).compile();

        const svc = module.get<DriverLocationService>(DriverLocationService);

        await expect(
            svc.updateDriverLocation(DRIVER_USER_ID, { latitude: 17.385, longitude: 78.4867 }),
        ).rejects.toThrow(BadRequestException);
    });

    it("rider can read assigned driver's location", async () => {
        const result = await service.getRideDriverLocation(RIDE_ID, RIDER_USER_ID);

        expect(result).toMatchObject({
            latitude: 17.385,
            longitude: 78.4867,
            heading: 90,
            speedKmh: 32,
            accuracyM: 8,
        });
    });

    it("assigned driver can read ride location", async () => {
        const result = await service.getRideDriverLocation(RIDE_ID, DRIVER_USER_ID);

        expect(result).toMatchObject({
            latitude: 17.385,
            longitude: 78.4867,
        });
    });

    it("unrelated rider cannot read driver location", async () => {
        await expect(
            service.getRideDriverLocation(RIDE_ID, "unrelated-rider-uuid"),
        ).rejects.toThrow(ForbiddenException);
    });

    it("unrelated driver cannot read location", async () => {
        await expect(
            service.getRideDriverLocation(RIDE_ID, "unrelated-driver-user-uuid"),
        ).rejects.toThrow(ForbiddenException);
    });

    it("returns NotFoundException for non-existent ride", async () => {
        await expect(
            service.getRideDriverLocation("non-existent-ride", RIDER_USER_ID),
        ).rejects.toThrow(NotFoundException);
    });

    it("returns null fields when driver location is not yet available", async () => {
        prismaStub = buildPrismaStub({ location: null });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DriverLocationService,
                { provide: PrismaService, useValue: prismaStub },
                { provide: RidesGateway, useValue: gatewayStub },
            ],
        }).compile();

        const svc = module.get<DriverLocationService>(DriverLocationService);

        const result = await svc.getRideDriverLocation(RIDE_ID, RIDER_USER_ID);

        expect(result).toEqual({
            latitude: null,
            longitude: null,
            heading: null,
            speedKmh: null,
            accuracyM: null,
            updatedAt: null,
        });
    });
});
