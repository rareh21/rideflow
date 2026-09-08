import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from "@nestjs/common";

import {
    Prisma,
    RideStatus,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateRideDto } from "./dto/create-ride.dto";
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
        const rider =
            await this.prisma.user.findUnique({
                where: {
                    id: riderId,
                },
                select: {
                    id: true,
                },
            });

        if (!rider) {
            throw new NotFoundException(
                "Rider not found",
            );
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

        return this.prisma.ride.create({
            data: {
                riderId,

                pickupLocationId:
                    dto.pickupLocationId,

                destinationLocationId:
                    dto.destinationLocationId,

                rideType:
                    dto.rideType,

                estimatedFare:
                    dto.estimatedFare,

                estimatedDistanceKm:
                    dto.estimatedDistanceKm,

                estimatedDurationMinutes:
                    dto.estimatedDurationMinutes,

                paymentMethod:
                    dto.paymentMethod,

                status:
                    RideStatus.SEARCHING_DRIVER,
            },

            include: {
                pickupLocation: true,
                destinationLocation: true,
            },
        });
    }

    async findById(
        rideId: string,
        userId: string,
    ) {
        const ride =
            await this.prisma.ride.findUnique({
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
                            userId: true,
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

        const isRider =
            ride.riderId === userId;

        const isAssignedDriver =
            ride.driver?.userId === userId;

        if (
            !isRider &&
            !isAssignedDriver
        ) {
            throw new ForbiddenException(
                "You do not have access to this ride",
            );
        }

        return ride;
    }

    async getMyRides(
        riderId: string,
    ) {
        return this.prisma.ride.findMany({
            where: {
                riderId,
            },

            orderBy: {
                createdAt: "desc",
            },

            include: {
                pickupLocation: true,

                destinationLocation: true,

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
    }

    async getDriverRides(
        userId: string,
    ) {
        const driver =
            await this.prisma.driver.findUnique({
                where: {
                    userId,
                },
                select: {
                    id: true,
                },
            });

        if (!driver) {
            throw new NotFoundException(
                "Driver profile not found",
            );
        }

        return this.prisma.ride.findMany({
            where: {
                driverId: driver.id,
            },

            orderBy: {
                createdAt: "desc",
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
            },
        });
    }

    async updateStatus(
        rideId: string,
        userId: string,
        nextStatus: RideStatus,
    ) {
        const ride =
            await this.prisma.ride.findUnique({
                where: {
                    id: rideId,
                },

                include: {
                    driver: {
                        select: {
                            id: true,
                            userId: true,
                        },
                    },
                },
            });

        if (!ride) {
            throw new NotFoundException(
                "Ride not found",
            );
        }

        const isRider =
            ride.riderId === userId;

        const isAssignedDriver =
            ride.driver?.userId === userId;

        if (
            !isRider &&
            !isAssignedDriver
        ) {
            throw new ForbiddenException(
                "You do not have access to this ride",
            );
        }

        /*
         * Rider can cancel the ride.
         */
        if (isRider) {
            if (
                nextStatus !==
                RideStatus.CANCELLED
            ) {
                throw new ForbiddenException(
                    "Rider cannot perform this ride status transition",
                );
            }
        }

        /*
         * Assigned driver controls
         * the active ride lifecycle.
         */
        if (isAssignedDriver) {
            const driverStatuses: RideStatus[] = [
                RideStatus.DRIVER_ARRIVING,
                RideStatus.IN_PROGRESS,
                RideStatus.COMPLETED,
            ];

            if (
                !driverStatuses.includes(
                    nextStatus,
                )
            ) {
                throw new ForbiddenException(
                    "Driver cannot perform this ride status transition",
                );
            }
        }

        /*
         * Matching-related transitions
         * are controlled by the matching
         * workflow.
         */
        if (
            nextStatus ===
            RideStatus.SEARCHING_DRIVER ||
            nextStatus ===
            RideStatus.DRIVER_ASSIGNED
        ) {
            throw new ForbiddenException(
                "This ride status is controlled by the driver matching workflow",
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
        const ride =
            await this.prisma.ride.findUnique({
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
            ride.status !==
            RideStatus.SEARCHING_DRIVER
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

                    if (
                        claimedDriver.count !== 1
                    ) {
                        return null;
                    }

                    return tx.ride.update({
                        where: {
                            id: rideId,
                        },

                        data: {
                            driverId:
                                driver.id,

                            status:
                                RideStatus.DRIVER_ASSIGNED,
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