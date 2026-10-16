import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { RideStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { RidesGateway } from "../../rides/rides.gateway";
import { UpdateDriverLocationDto } from "./dto/update-driver-location.dto";

export type NormalizedDriverLocation = {
    latitude: number;
    longitude: number;
    heading: number | null;
    speedKmh: number | null;
    accuracyM: number | null;
    updatedAt: string;
};

@Injectable()
export class DriverLocationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly ridesGateway: RidesGateway,
    ) { }

    async updateDriverLocation(
        userId: string,
        dto: UpdateDriverLocationDto,
    ): Promise<NormalizedDriverLocation> {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
        });

        if (!driver) {
            throw new UnauthorizedException("Authenticated user is not an active driver.");
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

        const activeRide = await this.prisma.ride.findFirst({
            where: {
                driverId: driver.id,
                status: {
                    in: [
                        RideStatus.DRIVER_ASSIGNED,
                        RideStatus.DRIVER_ARRIVING,
                        RideStatus.DRIVER_ARRIVED,
                        RideStatus.IN_PROGRESS,
                    ],
                },
            },
        });

        const normalizedLocation: NormalizedDriverLocation = {
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            heading: location.heading !== null ? Number(location.heading) : null,
            speedKmh: location.speedKmh !== null ? Number(location.speedKmh) : null,
            accuracyM: location.accuracyM !== null ? Number(location.accuracyM) : null,
            updatedAt: location.updatedAt.toISOString(),
        };

        if (activeRide) {
            this.ridesGateway.emitDriverLocationUpdated(
                activeRide.riderId,
                driver.userId,
                {
                    rideId: activeRide.id,
                    driverId: driver.id,
                    location: normalizedLocation,
                },
            );
        }

        return normalizedLocation;
    }

    async getRideDriverLocation(
        rideId: string,
        userId: string,
    ): Promise<NormalizedDriverLocation | null> {
        const ride = await this.prisma.ride.findUnique({
            where: { id: rideId },
            include: { driver: true },
        });

        if (!ride) {
            throw new NotFoundException("Ride not found.");
        }

        if (!ride.driverId || !ride.driver) {
            throw new BadRequestException("Ride does not have an assigned driver.");
        }

        const isRider = ride.riderId === userId;
        const isDriver = ride.driver.userId === userId;

        if (!isRider && !isDriver) {
            throw new ForbiddenException(
                "You are not authorized to view driver location for this ride.",
            );
        }

        const location = await this.prisma.driverLocation.findUnique({
            where: { driverId: ride.driverId },
        });

        if (!location) {
            return null;
        }

        return {
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            heading: location.heading !== null ? Number(location.heading) : null,
            speedKmh: location.speedKmh !== null ? Number(location.speedKmh) : null,
            accuracyM: location.accuracyM !== null ? Number(location.accuracyM) : null,
            updatedAt: location.updatedAt.toISOString(),
        };
    }
}
