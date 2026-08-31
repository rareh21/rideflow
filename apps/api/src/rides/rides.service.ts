import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateRideDto } from "./dto/create-ride.dto";
import { RideStatus } from "@prisma/client";
import { canTransitionRideStatus } from "./ride-status";

@Injectable()
export class RidesService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async create(
        riderId: string,
        dto: CreateRideDto,
    ) {
        const rider = await this.prisma.user.findUnique({
            where: {
                id: riderId,
            },
            select: {
                id: true,
                role: true,
            },
        });

        if (!rider) {
            throw new NotFoundException("Rider not found");
        }

        const pickupLocation =
            await this.prisma.location.findUnique({
                where: {
                    id: dto.pickupLocationId,
                },
            });

        if (!pickupLocation) {
            throw new NotFoundException(
                "Pickup location not found",
            );
        }

        const destinationLocation =
            await this.prisma.location.findUnique({
                where: {
                    id: dto.destinationLocationId,
                },
            });

        if (!destinationLocation) {
            throw new NotFoundException(
                "Destination location not found",
            );
        }

        const ride = await this.prisma.ride.create({
            data: {
                riderId,

                pickupLocationId:
                    dto.pickupLocationId,

                destinationLocationId:
                    dto.destinationLocationId,

                rideType: dto.rideType,

                estimatedFare:
                    dto.estimatedFare,

                estimatedDistanceKm:
                    dto.estimatedDistanceKm,

                estimatedDurationMinutes:
                    dto.estimatedDurationMinutes,

                paymentMethod:
                    dto.paymentMethod,

                status: "SEARCHING_DRIVER",
            },

            include: {
                pickupLocation: true,
                destinationLocation: true,
            },
        });

        return ride;
    }

    async findById(
        rideId: string,
        userId: string,
    ) {
        const ride = await this.prisma.ride.findUnique({
            where: {
                id: rideId,
            },
            include: {
                pickupLocation: true,
                destinationLocation: true,
                rider: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                driver: {
                    select: {
                        id: true,
                        status: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        vehicle: {
                            select: {
                                make: true,
                                model: true,
                                year: true,
                                plateNumber: true,
                            },
                        },
                    },
                },
            },
        });

        if (!ride) {
            throw new NotFoundException(
                "Ride not found",
            );
        }

        if (ride.riderId !== userId) {
            throw new ForbiddenException(
                "You do not have access to this ride",
            );
        }

        return ride;
    }

    async updateStatus(
        rideId: string,
        userId: string,
        nextStatus: RideStatus,
    ) {
        const ride = await this.prisma.ride.findUnique({
            where: {
                id: rideId,
            },
        });

        if (!ride) {
            throw new NotFoundException(
                "Ride not found",
            );
        }

        if (ride.riderId !== userId) {
            throw new ForbiddenException(
                "You do not have access to this ride",
            );
        }

        if (
            !canTransitionRideStatus(
                ride.status,
                nextStatus,
            )
        ) {
            throw new BadRequestException(
                `Cannot change ride status from ${ride.status} to ${nextStatus}`,
            );
        }

        return this.prisma.ride.update({
            where: {
                id: rideId,
            },
            data: {
                status: nextStatus,
            },
        });
    }

    async findAvailableDriver() {
        return this.prisma.driver.findFirst({
            where: {
                status: "AVAILABLE",
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                vehicle: true,
            },
        });
    }

    async assignDriver(
        rideId: string,
    ) {
        const ride = await this.prisma.ride.findUnique({
            where: {
                id: rideId,
            },
        });

        if (!ride) {
            throw new NotFoundException(
                "Ride not found",
            );
        }

        if (
            ride.status !== "SEARCHING_DRIVER"
        ) {
            throw new BadRequestException(
                "Ride is not searching for a driver",
            );
        }

        const driver =
            await this.findAvailableDriver();

        if (!driver) {
            return {
                assigned: false,
                message:
                    "No available driver found",
            };
        }

        const updatedRide =
            await this.prisma.$transaction(
                async (tx) => {
                    const claimedDriver =
                        await tx.driver.updateMany({
                            where: {
                                id: driver.id,
                                status: "AVAILABLE",
                            },
                            data: {
                                status: "BUSY",
                            },
                        });

                    if (claimedDriver.count !== 1) {
                        return null;
                    }

                    return tx.ride.update({
                        where: {
                            id: rideId,
                        },
                        data: {
                            driverId: driver.id,
                            status: "DRIVER_ASSIGNED",
                        },
                        include: {
                            driver: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                    vehicle: true,
                                },
                            },
                        },
                    });
                },
            );

        if (!updatedRide) {
            return {
                assigned: false,
                message:
                    "Driver was already assigned",
            };
        }

        return {
            assigned: true,
            ride: updatedRide,
        };
    }
}