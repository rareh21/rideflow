import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RidesGateway } from "../../rides/rides.gateway";
import { UpdateDriverLocationDto } from "./dto/update-driver-location.dto";
import { RideStatus } from "@prisma/client";

export type DriverLocationResponse = {
    latitude: number | null;
    longitude: number | null;
    heading: number | null;
    speedKmh: number | null;
    accuracyM: number | null;
    updatedAt: string | null;
};

const ACTIVE_RIDE_STATUSES: RideStatus[] = [
    RideStatus.DRIVER_ASSIGNED,
    RideStatus.DRIVER_ARRIVING,
    RideStatus.DRIVER_ARRIVED,
    RideStatus.IN_PROGRESS,
];

@Injectable()
export class DriverLocationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly ridesGateway: RidesGateway,
    ) { }

    async updateDriverLocation(
        userId: string,
        dto: UpdateDriverLocationDto,
    ): Promise<DriverLocationResponse> {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
        });

        if (!driver) {
            throw new ForbiddenException("User is not an active driver");
        }

        const activeRide = await this.prisma.ride.findFirst({
            where: {
                driverId: driver.id,
                status: { in: ACTIVE_RIDE_STATUSES },
            },
        });

        if (!activeRide) {
            throw new BadRequestException(
                "Driver does not have an active ride for live location updates",
            );
        }

        const location = await this.prisma.driverLocation.upsert({
            where: { driverId: driver.id },
            create: {
                driverId: driver.id,
                latitude: dto.latitude,
                longitude: dto.longitude,
                heading: dto.heading ?? null,
                speedKmh: dto.speedKmh ?? null,
                accuracyM: dto.accuracyM ?? null,
            },
            update: {
                latitude: dto.latitude,
                longitude: dto.longitude,
                heading: dto.heading ?? null,
                speedKmh: dto.speedKmh ?? null,
                accuracyM: dto.accuracyM ?? null,
            },
        });

        const formattedLocation = {
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            heading: location.heading !== null && location.heading !== undefined ? Number(location.heading) : null,
            speedKmh: location.speedKmh !== null && location.speedKmh !== undefined ? Number(location.speedKmh) : null,
            accuracyM: location.accuracyM !== null && location.accuracyM !== undefined ? Number(location.accuracyM) : null,
            updatedAt: location.updatedAt.toISOString(),
        };

        this.ridesGateway.emitDriverLocationUpdated(
            activeRide.riderId,
            driver.userId,
            {
                rideId: activeRide.id,
                driverId: driver.id,
                location: formattedLocation,
            },
        );

        return formattedLocation;
    }

    async getRideDriverLocation(
        rideId: string,
        userId: string,
    ): Promise<DriverLocationResponse> {
        const ride = await this.prisma.ride.findUnique({
            where: { id: rideId },
            include: { driver: true },
        });

        if (!ride) {
            throw new NotFoundException("Ride not found");
        }

        if (!ride.driverId || !ride.driver) {
            return {
                latitude: null,
                longitude: null,
                heading: null,
                speedKmh: null,
                accuracyM: null,
                updatedAt: null,
            };
        }

        const isRider = ride.riderId === userId;
        const isAssignedDriver = ride.driver.userId === userId;

        if (!isRider && !isAssignedDriver) {
            throw new ForbiddenException(
                "Access denied to ride driver location",
            );
        }

        const location = await this.prisma.driverLocation.findUnique({
            where: { driverId: ride.driverId },
        });

        if (!location) {
            return {
                latitude: null,
                longitude: null,
                heading: null,
                speedKmh: null,
                accuracyM: null,
                updatedAt: null,
            };
        }

        return {
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            heading: location.heading !== null && location.heading !== undefined ? Number(location.heading) : null,
            speedKmh: location.speedKmh !== null && location.speedKmh !== undefined ? Number(location.speedKmh) : null,
            accuracyM: location.accuracyM !== null && location.accuracyM !== undefined ? Number(location.accuracyM) : null,
            updatedAt: location.updatedAt.toISOString(),
        };
    }
}
