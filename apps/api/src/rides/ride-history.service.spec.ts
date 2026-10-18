import {
    BadRequestException,
    NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { RideStatus, RideType, PaymentMethod, PaymentStatus } from "@prisma/client";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

import { PrismaService } from "../prisma/prisma.service";
import { RidesGateway } from "./rides.gateway";
import { RideTimeoutService } from "./ride-timeout.service";
import { RoutingService } from "./routing/routing.service";
import { RidesService } from "./rides.service";
import { RideHistoryQueryDto } from "./dto/ride-history-query.dto";

describe("RidesService - History, Search & Filtering", () => {
    let service: RidesService;
    let prismaMock: any;

    const mockDate = new Date("2026-09-20T10:00:00.000Z");

    const sampleRideDbItem = {
        id: "ride-uuid-1",
        riderId: "rider-1",
        driverId: "driver-1",
        pickupLocationId: "pickup-1",
        destinationLocationId: "dest-1",
        rideType: RideType.GO,
        status: RideStatus.COMPLETED,
        estimatedFare: "250.50",
        estimatedDistanceKm: "12.4",
        estimatedDurationMinutes: 25,
        paymentMethod: PaymentMethod.UPI,
        createdAt: mockDate,
        updatedAt: mockDate,
        completedAt: mockDate,
        pickupLocation: {
            id: "pickup-1",
            label: "Kondapur",
            latitude: "17.4700",
            longitude: "78.3500",
        },
        destinationLocation: {
            id: "dest-1",
            label: "Madhapur",
            latitude: "17.4512",
            longitude: "78.3858",
        },
        driver: {
            id: "driver-1",
            status: "AVAILABLE",
            user: {
                id: "driver-user-1",
                name: "Ramesh Driver",
            },
            vehicle: {
                make: "Maruti",
                model: "Dzire",
                year: 2022,
                plateNumber: "TS09EA1234",
            },
        },
        rider: {
            id: "rider-1",
            name: "John Rider",
            email: "john@example.com",
        },
        payment: {
            id: "payment-1",
            amount: "250.50",
            currency: "INR",
            method: PaymentMethod.UPI,
            status: PaymentStatus.SUCCEEDED,
        },
        reviews: [
            {
                id: "review-1",
                rating: 5,
                comment: "Great driving!",
                reviewerId: "rider-1",
                revieweeId: "driver-user-1",
            },
        ],
    };

    beforeEach(async () => {
        prismaMock = {
            ride: {
                count: jest.fn(),
                findMany: jest.fn(),
            },
            driver: {
                findUnique: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RidesService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: RidesGateway, useValue: {} },
                { provide: RideTimeoutService, useValue: {} },
                { provide: RoutingService, useValue: {} },
            ],
        }).compile();

        service = module.get<RidesService>(RidesService);
    });

    describe("DTO Validation", () => {
        it("accepts valid query parameters", async () => {
            const dto = plainToInstance(RideHistoryQueryDto, {
                page: 2,
                limit: 20,
                status: RideStatus.COMPLETED,
                startDate: "2026-09-01T00:00:00.000Z",
                endDate: "2026-09-30T23:59:59.000Z",
                search: "ride-123",
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
            expect(dto.page).toBe(2);
            expect(dto.limit).toBe(20);
        });

        it("rejects limit greater than 50", async () => {
            const dto = plainToInstance(RideHistoryQueryDto, {
                limit: 100,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty("max");
        });

        it("rejects invalid status", async () => {
            const dto = plainToInstance(RideHistoryQueryDto, {
                status: "UNKNOWN_STATUS",
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty("isEnum");
        });

        it("rejects invalid date string", async () => {
            const dto = plainToInstance(RideHistoryQueryDto, {
                startDate: "not-a-date",
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty("isDateString");
        });
    });

    describe("getRiderRideHistory", () => {
        it("queries rides scoped strictly to the authenticated rider", async () => {
            prismaMock.ride.count.mockResolvedValue(1);
            prismaMock.ride.findMany.mockResolvedValue([sampleRideDbItem]);

            const result = await service.getRiderRideHistory("rider-1", {
                page: 1,
                limit: 10,
            });

            expect(prismaMock.ride.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        riderId: "rider-1",
                    }),
                }),
            );

            expect(prismaMock.ride.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        riderId: "rider-1",
                    }),
                    skip: 0,
                    take: 10,
                    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                }),
            );

            expect(result.items).toHaveLength(1);
            expect(result.items[0].id).toBe("ride-uuid-1");
            expect(typeof result.items[0].estimatedFare).toBe("number");
            expect(result.items[0].estimatedFare).toBe(250.5);
            expect(result.items[0].payment?.status).toBe(PaymentStatus.SUCCEEDED);
            expect(result.items[0].reviews).toHaveLength(1);
            expect(result.meta).toEqual({
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasPreviousPage: false,
                hasNextPage: false,
            });
        });

        it("applies status and search filter properly", async () => {
            prismaMock.ride.count.mockResolvedValue(0);
            prismaMock.ride.findMany.mockResolvedValue([]);

            await service.getRiderRideHistory("rider-1", {
                status: RideStatus.CANCELLED,
                search: "abc-xyz",
            });

            expect(prismaMock.ride.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        riderId: "rider-1",
                        status: RideStatus.CANCELLED,
                        id: {
                            contains: "abc-xyz",
                            mode: "insensitive",
                        },
                    }),
                }),
            );
        });

        it("applies valid date range filters", async () => {
            prismaMock.ride.count.mockResolvedValue(0);
            prismaMock.ride.findMany.mockResolvedValue([]);

            const startDate = "2026-09-01T00:00:00.000Z";
            const endDate = "2026-09-10T00:00:00.000Z";

            await service.getRiderRideHistory("rider-1", {
                startDate,
                endDate,
            });

            expect(prismaMock.ride.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        riderId: "rider-1",
                        createdAt: {
                            gte: new Date(startDate),
                            lte: new Date(endDate),
                        },
                    }),
                }),
            );
        });

        it("rejects date range where startDate > endDate", async () => {
            await expect(
                service.getRiderRideHistory("rider-1", {
                    startDate: "2026-09-20T00:00:00.000Z",
                    endDate: "2026-09-10T00:00:00.000Z",
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it("computes pagination meta correctly for multi-page results", async () => {
            prismaMock.ride.count.mockResolvedValue(25);
            prismaMock.ride.findMany.mockResolvedValue([sampleRideDbItem]);

            const result = await service.getRiderRideHistory("rider-1", {
                page: 2,
                limit: 10,
            });

            expect(result.meta).toEqual({
                total: 25,
                page: 2,
                limit: 10,
                totalPages: 3,
                hasPreviousPage: true,
                hasNextPage: true,
            });
            expect(prismaMock.ride.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 10,
                }),
            );
        });

        it("does not leak sensitive user passwords or tokens", async () => {
            prismaMock.ride.count.mockResolvedValue(1);
            prismaMock.ride.findMany.mockResolvedValue([sampleRideDbItem]);

            const result = await service.getRiderRideHistory("rider-1", {});
            const ride = result.items[0];

            expect((ride as any).passwordHash).toBeUndefined();
            expect((ride.driver?.user as any)?.passwordHash).toBeUndefined();
        });
    });

    describe("getDriverRideHistory", () => {
        it("resolves driver record from authenticated userId and scopes query", async () => {
            prismaMock.driver.findUnique.mockResolvedValue({ id: "driver-uuid-42" });
            prismaMock.ride.count.mockResolvedValue(1);
            prismaMock.ride.findMany.mockResolvedValue([sampleRideDbItem]);

            const result = await service.getDriverRideHistory("user-driver-1", {
                page: 1,
                limit: 10,
            });

            expect(prismaMock.driver.findUnique).toHaveBeenCalledWith({
                where: { userId: "user-driver-1" },
                select: { id: true },
            });

            expect(prismaMock.ride.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        driverId: "driver-uuid-42",
                    }),
                }),
            );

            expect(result.items).toHaveLength(1);
        });

        it("throws NotFoundException if driver profile does not exist", async () => {
            prismaMock.driver.findUnique.mockResolvedValue(null);

            await expect(
                service.getDriverRideHistory("unregistered-driver-user", {}),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
