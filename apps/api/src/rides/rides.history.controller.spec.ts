import { Test, TestingModule } from "@nestjs/testing";
import { UserRole } from "@prisma/client";

import { RidesController } from "./rides.controller";
import { RidesService } from "./rides.service";
import { RideHistoryQueryDto } from "./dto/ride-history-query.dto";

describe("RidesController - Ride History Endpoints", () => {
    let controller: RidesController;
    let serviceMock: any;

    beforeEach(async () => {
        serviceMock = {
            create: jest.fn(),
            createQuote: jest.fn(),
            createRoutePreview: jest.fn(),
            getMyRides: jest.fn(),
            getDriverRides: jest.fn(),
            getRiderRideHistory: jest.fn(),
            getDriverRideHistory: jest.fn(),
            findById: jest.fn(),
            updateStatus: jest.fn(),
            acceptRide: jest.fn(),
            getReceipt: jest.fn(),
            createReview: jest.fn(),
            getReview: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [RidesController],
            providers: [{ provide: RidesService, useValue: serviceMock }],
        }).compile();

        controller = module.get<RidesController>(RidesController);
    });

    it("GET /rides/my/history passes authenticated user identity and query to service", async () => {
        const user = { userId: "rider-123", email: "rider@example.com", role: UserRole.RIDER };
        const query: RideHistoryQueryDto = { page: 1, limit: 10 };
        const expected = { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1, hasPreviousPage: false, hasNextPage: false } };

        serviceMock.getRiderRideHistory.mockResolvedValue(expected);

        const result = await controller.getMyRideHistory(user as any, query);

        expect(serviceMock.getRiderRideHistory).toHaveBeenCalledWith("rider-123", query);
        expect(result).toBe(expected);
    });

    it("GET /rides/driver/my/history passes authenticated driver user identity and query to service", async () => {
        const user = { userId: "driver-user-456", email: "driver@example.com", role: UserRole.DRIVER };
        const query: RideHistoryQueryDto = { page: 2, limit: 5 };
        const expected = { items: [], meta: { total: 0, page: 2, limit: 5, totalPages: 1, hasPreviousPage: true, hasNextPage: false } };

        serviceMock.getDriverRideHistory.mockResolvedValue(expected);

        const result = await controller.getDriverRideHistory(user as any, query);

        expect(serviceMock.getDriverRideHistory).toHaveBeenCalledWith("driver-user-456", query);
        expect(result).toBe(expected);
    });
});
