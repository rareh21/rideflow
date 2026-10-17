import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { RideStatus } from "@prisma/client";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

import { PrismaService } from "../../prisma/prisma.service";
import { RidesGateway } from "../../rides/rides.gateway";
import { DriverLocationService } from "./driver-location.service";
import { UpdateDriverLocationDto } from "./dto/update-driver-location.dto";

describe("DriverLocationService", () => {
    let service: DriverLocationService;
    let prismaMock: any;
    let gatewayMock: any;

    beforeEach(async () => {
        prismaMock = {
            driver: {
                findUnique: jest.fn(),
            },
            driverLocation: {
                upsert: jest.fn(),
                findUnique: jest.fn(),
            },
            ride: {
                findFirst: jest.fn(),
                findUnique: jest.fn(),
            },
        };

        gatewayMock = {
            emitDriverLocationUpdated: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DriverLocationService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: RidesGateway, useValue: gatewayMock },
            ],
        }).compile();

        service = module.get<DriverLocationService>(DriverLocationService);
    });

    describe("updateDriverLocation", () => {
        it("throws UnauthorizedException if user is not a driver", async () => {
            prismaMock.driver.findUnique.mockResolvedValue(null);

            await expect(
                service.updateDriverLocation("user-1", {
                    latitude: 17.385,
                    longitude: 78.4867,
                }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it("upserts driver location and returns normalized response when driver has no active ride", async () => {
            const driver = { id: "driver-1", userId: "user-driver-1" };
            prismaMock.driver.findUnique.mockResolvedValue(driver);

            const now = new Date();
            prismaMock.driverLocation.upsert.mockResolvedValue({
                id: "loc-1",
                driverId: "driver-1",
                latitude: "17.3850",
                longitude: "78.4867",
                heading: "90",
                speedKmh: "32",
                accuracyM: "8",
                updatedAt: now,
                createdAt: now,
            });

            prismaMock.ride.findFirst.mockResolvedValue(null);

            const result = await service.updateDriverLocation("user-driver-1", {
                latitude: 17.385,
                longitude: 78.4867,
                heading: 90,
                speedKmh: 32,
                accuracyM: 8,
            });

            expect(result).toEqual({
                latitude: 17.385,
                longitude: 78.4867,
                heading: 90,
                speedKmh: 32,
                accuracyM: 8,
                updatedAt: now.toISOString(),
            });

            expect(gatewayMock.emitDriverLocationUpdated).not.toHaveBeenCalled();
        });

        it("emits realtime driver.location.updated event when driver has an active ride", async () => {
            const driver = { id: "driver-1", userId: "user-driver-1" };
            prismaMock.driver.findUnique.mockResolvedValue(driver);

            const now = new Date();
            prismaMock.driverLocation.upsert.mockResolvedValue({
                id: "loc-1",
                driverId: "driver-1",
                latitude: "17.3850",
                longitude: "78.4867",
                heading: "90",
                speedKmh: "32",
                accuracyM: "8",
                updatedAt: now,
                createdAt: now,
            });

            const activeRide = {
                id: "ride-123",
                riderId: "user-rider-1",
                driverId: "driver-1",
                status: RideStatus.IN_PROGRESS,
            };
            prismaMock.ride.findFirst.mockResolvedValue(activeRide);

            const result = await service.updateDriverLocation("user-driver-1", {
                latitude: 17.385,
                longitude: 78.4867,
                heading: 90,
                speedKmh: 32,
                accuracyM: 8,
            });

            expect(gatewayMock.emitDriverLocationUpdated).toHaveBeenCalledWith(
                "user-rider-1",
                "user-driver-1",
                {
                    rideId: "ride-123",
                    driverId: "driver-1",
                    location: result,
                },
            );
        });

        it("does not emit realtime event when ride is COMPLETED or CANCELLED", async () => {
            const driver = { id: "driver-1", userId: "user-driver-1" };
            prismaMock.driver.findUnique.mockResolvedValue(driver);

            const now = new Date();
            prismaMock.driverLocation.upsert.mockResolvedValue({
                id: "loc-1",
                driverId: "driver-1",
                latitude: "17.3850",
                longitude: "78.4867",
                heading: null,
                speedKmh: null,
                accuracyM: null,
                updatedAt: now,
                createdAt: now,
            });

            // findFirst returns null because query filters for active statuses
            prismaMock.ride.findFirst.mockResolvedValue(null);

            await service.updateDriverLocation("user-driver-1", {
                latitude: 17.385,
                longitude: 78.4867,
            });

            expect(gatewayMock.emitDriverLocationUpdated).not.toHaveBeenCalled();
        });

        it("rejects stale or out-of-order update when incoming timestamp is older than existing updatedAt", async () => {
            const driver = { id: "driver-1", userId: "user-driver-1" };
            prismaMock.driver.findUnique.mockResolvedValue(driver);

            const existingUpdatedAt = new Date("2026-10-18T10:00:10Z");
            prismaMock.driverLocation.findUnique.mockResolvedValue({
                id: "loc-1",
                driverId: "driver-1",
                updatedAt: existingUpdatedAt,
            });

            await expect(
                service.updateDriverLocation("user-driver-1", {
                    latitude: 17.385,
                    longitude: 78.4867,
                    timestamp: "2026-10-18T10:00:05Z", // 5 seconds older
                }),
            ).rejects.toThrow(BadRequestException);

            expect(prismaMock.driverLocation.upsert).not.toHaveBeenCalled();
        });

        it("accepts update when incoming timestamp is newer than existing updatedAt", async () => {
            const driver = { id: "driver-1", userId: "user-driver-1" };
            prismaMock.driver.findUnique.mockResolvedValue(driver);

            const existingUpdatedAt = new Date("2026-10-18T10:00:10Z");
            prismaMock.driverLocation.findUnique.mockResolvedValue({
                id: "loc-1",
                driverId: "driver-1",
                updatedAt: existingUpdatedAt,
            });

            const newUpdatedAt = new Date("2026-10-18T10:00:15Z");
            prismaMock.driverLocation.upsert.mockResolvedValue({
                id: "loc-1",
                driverId: "driver-1",
                latitude: "17.3850",
                longitude: "78.4867",
                heading: null,
                speedKmh: null,
                accuracyM: null,
                updatedAt: newUpdatedAt,
            });
            prismaMock.ride.findFirst.mockResolvedValue(null);

            const result = await service.updateDriverLocation("user-driver-1", {
                latitude: 17.385,
                longitude: 78.4867,
                timestamp: "2026-10-18T10:00:15Z",
            });

            expect(result.latitude).toBe(17.385);
            expect(prismaMock.driverLocation.upsert).toHaveBeenCalled();
        });

        it("rejects location update if specified ride is COMPLETED", async () => {
            const driver = { id: "driver-1", userId: "user-driver-1" };
            prismaMock.driver.findUnique.mockResolvedValue(driver);

            prismaMock.ride.findUnique.mockResolvedValue({
                id: "ride-1",
                driverId: "driver-1",
                status: RideStatus.COMPLETED,
            });

            await expect(
                service.updateDriverLocation("user-driver-1", {
                    latitude: 17.385,
                    longitude: 78.4867,
                    rideId: "ride-1",
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it("rejects location update if specified ride is CANCELLED", async () => {
            const driver = { id: "driver-1", userId: "user-driver-1" };
            prismaMock.driver.findUnique.mockResolvedValue(driver);

            prismaMock.ride.findUnique.mockResolvedValue({
                id: "ride-1",
                driverId: "driver-1",
                status: RideStatus.CANCELLED,
            });

            await expect(
                service.updateDriverLocation("user-driver-1", {
                    latitude: 17.385,
                    longitude: 78.4867,
                    rideId: "ride-1",
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it("rejects location update if driver is not assigned to the specified ride", async () => {
            const driver = { id: "driver-1", userId: "user-driver-1" };
            prismaMock.driver.findUnique.mockResolvedValue(driver);

            prismaMock.ride.findUnique.mockResolvedValue({
                id: "ride-1",
                driverId: "different-driver",
                status: RideStatus.IN_PROGRESS,
            });

            await expect(
                service.updateDriverLocation("user-driver-1", {
                    latitude: 17.385,
                    longitude: 78.4867,
                    rideId: "ride-1",
                }),
            ).rejects.toThrow(ForbiddenException);
        });

        it("delivers realtime location updates exclusively to rider and driver private rooms", async () => {
            const driver = { id: "driver-1", userId: "user-driver-1" };
            prismaMock.driver.findUnique.mockResolvedValue(driver);

            const now = new Date();
            prismaMock.driverLocation.upsert.mockResolvedValue({
                id: "loc-1",
                driverId: "driver-1",
                latitude: "17.3850",
                longitude: "78.4867",
                heading: null,
                speedKmh: null,
                accuracyM: null,
                updatedAt: now,
            });

            prismaMock.ride.findFirst.mockResolvedValue({
                id: "ride-123",
                riderId: "user-rider-1",
                driverId: "driver-1",
                status: RideStatus.DRIVER_ARRIVING,
            });

            await service.updateDriverLocation("user-driver-1", {
                latitude: 17.385,
                longitude: 78.4867,
            });

            expect(gatewayMock.emitDriverLocationUpdated).toHaveBeenCalledWith(
                "user-rider-1",
                "user-driver-1",
                expect.objectContaining({
                    rideId: "ride-123",
                    driverId: "driver-1",
                }),
            );
        });
    });

    describe("Coordinate validation (UpdateDriverLocationDto)", () => {
        it("passes validation for valid coordinates and metadata", async () => {
            const dto = plainToInstance(UpdateDriverLocationDto, {
                latitude: 17.385,
                longitude: 78.4867,
                heading: 180,
                speedKmh: 45.5,
                accuracyM: 10,
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it("fails validation for out-of-range latitude", async () => {
            const dto = plainToInstance(UpdateDriverLocationDto, {
                latitude: 95.0,
                longitude: 78.4867,
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe("latitude");
        });

        it("fails validation for out-of-range longitude", async () => {
            const dto = plainToInstance(UpdateDriverLocationDto, {
                latitude: 17.385,
                longitude: -185.0,
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe("longitude");
        });

        it("fails validation for negative speed or accuracy", async () => {
            const dto = plainToInstance(UpdateDriverLocationDto, {
                latitude: 17.385,
                longitude: 78.4867,
                speedKmh: -5,
                accuracyM: -2,
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(2);
        });
    });

    describe("getRideDriverLocation", () => {
        it("throws NotFoundException if ride does not exist", async () => {
            prismaMock.ride.findUnique.mockResolvedValue(null);

            await expect(
                service.getRideDriverLocation("non-existent-ride", "user-1"),
            ).rejects.toThrow(NotFoundException);
        });

        it("throws BadRequestException if ride has no assigned driver", async () => {
            prismaMock.ride.findUnique.mockResolvedValue({
                id: "ride-1",
                riderId: "user-rider-1",
                driverId: null,
                driver: null,
            });

            await expect(
                service.getRideDriverLocation("ride-1", "user-rider-1"),
            ).rejects.toThrow(BadRequestException);
        });

        it("throws ForbiddenException if requester is unrelated rider or driver", async () => {
            prismaMock.ride.findUnique.mockResolvedValue({
                id: "ride-1",
                riderId: "user-rider-1",
                driverId: "driver-1",
                driver: { id: "driver-1", userId: "user-driver-1" },
            });

            await expect(
                service.getRideDriverLocation("ride-1", "unrelated-user"),
            ).rejects.toThrow(ForbiddenException);
        });

        it("returns location for assigned rider", async () => {
            const now = new Date();
            prismaMock.ride.findUnique.mockResolvedValue({
                id: "ride-1",
                riderId: "user-rider-1",
                driverId: "driver-1",
                driver: { id: "driver-1", userId: "user-driver-1" },
            });

            prismaMock.driverLocation.findUnique.mockResolvedValue({
                id: "loc-1",
                driverId: "driver-1",
                latitude: "17.3850",
                longitude: "78.4867",
                heading: "90",
                speedKmh: "32",
                accuracyM: "8",
                updatedAt: now,
            });

            const result = await service.getRideDriverLocation("ride-1", "user-rider-1");

            expect(result).toEqual({
                latitude: 17.385,
                longitude: 78.4867,
                heading: 90,
                speedKmh: 32,
                accuracyM: 8,
                updatedAt: now.toISOString(),
            });
        });

        it("returns location for assigned driver", async () => {
            const now = new Date();
            prismaMock.ride.findUnique.mockResolvedValue({
                id: "ride-1",
                riderId: "user-rider-1",
                driverId: "driver-1",
                driver: { id: "driver-1", userId: "user-driver-1" },
            });

            prismaMock.driverLocation.findUnique.mockResolvedValue({
                id: "loc-1",
                driverId: "driver-1",
                latitude: "17.3850",
                longitude: "78.4867",
                heading: null,
                speedKmh: null,
                accuracyM: null,
                updatedAt: now,
            });

            const result = await service.getRideDriverLocation("ride-1", "user-driver-1");

            expect(result).toEqual({
                latitude: 17.385,
                longitude: 78.4867,
                heading: null,
                speedKmh: null,
                accuracyM: null,
                updatedAt: now.toISOString(),
            });
        });

        it("returns null if no location has been saved for the driver yet", async () => {
            prismaMock.ride.findUnique.mockResolvedValue({
                id: "ride-1",
                riderId: "user-rider-1",
                driverId: "driver-1",
                driver: { id: "driver-1", userId: "user-driver-1" },
            });

            prismaMock.driverLocation.findUnique.mockResolvedValue(null);

            const result = await service.getRideDriverLocation("ride-1", "user-rider-1");

            expect(result).toBeNull();
        });
    });
});
