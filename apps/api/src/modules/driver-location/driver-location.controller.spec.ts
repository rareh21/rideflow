import { Test, TestingModule } from "@nestjs/testing";

import {
    DriverLocationController,
    RideDriverLocationController,
} from "./driver-location.controller";
import { DriverLocationService } from "./driver-location.service";

describe("DriverLocationController & RideDriverLocationController", () => {
    let driverLocationController: DriverLocationController;
    let rideDriverLocationController: RideDriverLocationController;
    let serviceMock: any;

    beforeEach(async () => {
        serviceMock = {
            updateDriverLocation: jest.fn(),
            getRideDriverLocation: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [
                DriverLocationController,
                RideDriverLocationController,
            ],
            providers: [
                { provide: DriverLocationService, useValue: serviceMock },
            ],
        }).compile();

        driverLocationController = module.get<DriverLocationController>(
            DriverLocationController,
        );
        rideDriverLocationController = module.get<RideDriverLocationController>(
            RideDriverLocationController,
        );
    });

    it("driverLocationController.updateLocation delegates to service", async () => {
        const user = { userId: "driver-user-1", email: "d@d.com", role: "DRIVER" };
        const dto = { latitude: 17.385, longitude: 78.4867 };
        const expected = {
            latitude: 17.385,
            longitude: 78.4867,
            heading: null,
            speedKmh: null,
            accuracyM: null,
            updatedAt: new Date().toISOString(),
        };

        serviceMock.updateDriverLocation.mockResolvedValue(expected);

        const result = await driverLocationController.updateLocation(user as any, dto);

        expect(serviceMock.updateDriverLocation).toHaveBeenCalledWith(
            "driver-user-1",
            dto,
        );
        expect(result).toBe(expected);
    });

    it("rideDriverLocationController.getRideDriverLocation delegates to service", async () => {
        const user = { userId: "rider-user-1", email: "r@r.com", role: "RIDER" };
        const expected = {
            latitude: 17.385,
            longitude: 78.4867,
            heading: 90,
            speedKmh: 30,
            accuracyM: 5,
            updatedAt: new Date().toISOString(),
        };

        serviceMock.getRideDriverLocation.mockResolvedValue(expected);

        const result = await rideDriverLocationController.getRideDriverLocation(
            "ride-123",
            user as any,
        );

        expect(serviceMock.getRideDriverLocation).toHaveBeenCalledWith(
            "ride-123",
            "rider-user-1",
        );
        expect(result).toBe(expected);
    });
});
