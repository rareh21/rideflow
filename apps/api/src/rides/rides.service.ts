import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
} from "@nestjs/common";

import {
    RideStatus,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateRideDto } from "./dto/create-ride.dto";
import { CreateRideQuoteDto } from "./dto/create-ride-quote.dto";
import { RidesGateway } from "./rides.gateway";
import { RideTimeoutService } from "./ride-timeout.service";
import { canTransitionRideStatus } from "./ride-status";
import {
    haversineDistanceKm,
    estimatedDurationMinutes,
} from "./utils/location-calculator";
import { calculateFare } from "./utils/fare-calculator";

@Injectable()
export class RidesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly ridesGateway: RidesGateway,
        private readonly rideTimeoutService: RideTimeoutService,
    ) { }

    private emitRideUpdated(
        ride: {
            id: string;
            status: RideStatus;
            riderId: string;
            driver?: {
                userId?: string;
                user?: { id: string };
            } | null;
        },
    ) {
        this.ridesGateway.emitRideUpdated(
            ride.riderId,
            ride.driver?.userId ??
            ride.driver?.user?.id ??
            null,
            {
                rideId: ride.id,
                status: ride.status,
                ride,
            },
        );
    }

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

        if (dto.pickupLocationId === dto.destinationLocationId) {
            throw new BadRequestException(
                "Pickup and destination cannot be the same location",
            );
        }

        /*
         * Server-side fare computation — never trust client-supplied values.
         * Haversine gives straight-line distance; the Route Preview module
         * will replace this with a road-network calculation.
         */
        const distanceKm = haversineDistanceKm(
            Number(pickupLocation.latitude),
            Number(pickupLocation.longitude),
            Number(destinationLocation.latitude),
            Number(destinationLocation.longitude),
        );

        const durationMinutes = estimatedDurationMinutes(distanceKm);
        const fare = calculateFare(dto.rideType, distanceKm, durationMinutes);

        const ride = await this.prisma.ride.create({
            data: {
                riderId,

                pickupLocationId:
                    dto.pickupLocationId,

                destinationLocationId:
                    dto.destinationLocationId,

                rideType:
                    dto.rideType,

                estimatedFare: fare,

                estimatedDistanceKm: distanceKm,

                estimatedDurationMinutes: durationMinutes,

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

        this.emitRideUpdated(ride);

        // Start the no-driver-found timer. If no driver accepts within the
        // configured window the ride is auto-cancelled server-side.
        this.rideTimeoutService.scheduleTimeout(ride.id);

        return ride;
    }

    /**
     * Returns an estimated fare/distance/duration for the given route and
     * ride type WITHOUT creating a Ride record.
     *
     * The quote is informational only. The final Ride record always recalculates
     * these values server-side — the client cannot influence pricing by altering
     * the quote payload before confirmation.
     */
    async createQuote(dto: CreateRideQuoteDto) {
        const pickupLocation =
            await this.prisma.location.findUnique({
                where: { id: dto.pickupLocationId },
            });

        if (!pickupLocation) {
            throw new NotFoundException(
                "Pickup location not found",
            );
        }

        const destinationLocation =
            await this.prisma.location.findUnique({
                where: { id: dto.destinationLocationId },
            });

        if (!destinationLocation) {
            throw new NotFoundException(
                "Destination location not found",
            );
        }

        if (dto.pickupLocationId === dto.destinationLocationId) {
            throw new BadRequestException(
                "Pickup and destination cannot be the same location",
            );
        }

        const distanceKm = haversineDistanceKm(
            Number(pickupLocation.latitude),
            Number(pickupLocation.longitude),
            Number(destinationLocation.latitude),
            Number(destinationLocation.longitude),
        );

        const durationMinutes = estimatedDurationMinutes(distanceKm);
        const fare = calculateFare(dto.rideType, distanceKm, durationMinutes);

        return {
            pickupLocation,
            destinationLocation,
            rideType: dto.rideType,
            estimatedDistanceKm: distanceKm,
            estimatedDurationMinutes: durationMinutes,
            estimatedFare: fare,
            currency: "INR",
        };
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
        const ride = await this.prisma.ride.findUnique({
            where: {
                id: rideId,
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        userId: true,
                        status: true,
                    },
                },
            },
        });

        if (!ride) {
            throw new NotFoundException("Ride not found");
        }

        if (
            !canTransitionRideStatus(
                ride.status,
                nextStatus,
            )
        ) {
            throw new BadRequestException(
                `Ride cannot transition from ${ride.status} to ${nextStatus}`,
            );
        }

        const isRider = ride.riderId === userId;

        const isAssignedDriver =
            ride.driver?.userId === userId;

        if (!isRider && !isAssignedDriver) {
            throw new ForbiddenException(
                "You do not have access to this ride",
            );
        }

        /*
         * Rider can only cancel.
         */
        if (isRider) {
            if (nextStatus !== RideStatus.CANCELLED) {
                throw new ForbiddenException(
                    "Rider can only cancel the ride",
                );
            }
        }

        /*
         * Driver controls only their assigned ride
         * lifecycle.
         */
        if (isAssignedDriver) {
            const driverStatuses: RideStatus[] = [
                RideStatus.DRIVER_ARRIVING,
                RideStatus.IN_PROGRESS,
                RideStatus.COMPLETED,
                RideStatus.CANCELLED,
            ];

            if (
                !driverStatuses.includes(nextStatus)
            ) {
                throw new ForbiddenException(
                    "Driver cannot perform this ride transition",
                );
            }
        }

        /*
         * Any successful status transition clears the pending search timeout.
         * Covers rider manual cancel (SEARCHING_DRIVER → CANCELLED) and all
         * other transitions away from SEARCHING_DRIVER.
         */
        this.rideTimeoutService.cancelTimer(rideId);

        /*
         * Cancellation/completion of an assigned ride
         * must release the driver atomically.
         */
        if (
            (
                nextStatus === RideStatus.CANCELLED ||
                nextStatus === RideStatus.COMPLETED
            ) &&
            ride.driverId
        ) {
            const updatedRide = await this.prisma.$transaction(
                async (tx) => {
                    const updatedRide =
                        await tx.ride.update({
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

                    await tx.driver.updateMany({
                        where: {
                            id: ride.driverId!,
                            status: "BUSY",
                        },
                        data: {
                            status: "AVAILABLE",
                        },
                    });

                    return updatedRide;
                },
            );

            this.emitRideUpdated(updatedRide);

            return updatedRide;
        }

        const updatedRide = await this.prisma.ride.update({
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

        this.emitRideUpdated(updatedRide);

        return updatedRide;
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

        // Clear the search timeout — a driver was matched via admin assign.
        this.rideTimeoutService.cancelTimer(rideId);

        this.emitRideUpdated(updatedRide);

        return {
            assigned: true,
            ride: updatedRide,
        };
    }

    async getAvailableRideRequests() {
        return this.prisma.ride.findMany({
            where: {
                status: RideStatus.SEARCHING_DRIVER,
                driverId: null,
            },
            orderBy: {
                createdAt: "asc",
            },
            include: {
                pickupLocation: true,
                destinationLocation: true,
                rider: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async acceptRide(
        rideId: string,
        userId: string,
    ) {
        const driver = await this.prisma.driver.findUnique({
            where: {
                userId,
            },
        });

        if (!driver) {
            throw new NotFoundException(
                "Driver profile not found",
            );
        }

        if (driver.status !== "AVAILABLE") {
            throw new BadRequestException(
                "Driver must be available to accept a ride",
            );
        }

        const acceptedRide = await this.prisma.$transaction(
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
                    throw new ConflictException(
                        "Driver is no longer available",
                    );
                }

                const claimedRide =
                    await tx.ride.updateMany({
                        where: {
                            id: rideId,
                            status: RideStatus.SEARCHING_DRIVER,
                            driverId: null,
                        },
                        data: {
                            driverId: driver.id,
                            status: RideStatus.DRIVER_ASSIGNED,
                        },
                    });

                if (claimedRide.count !== 1) {
                    throw new ConflictException(
                        "Ride is no longer available",
                    );
                }

                return tx.ride.findUnique({
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
            },
        );

        if (acceptedRide) {
            // Clear the search timeout — a driver has accepted.
            this.rideTimeoutService.cancelTimer(rideId);

            this.emitRideUpdated(acceptedRide);
        }

        return {
            accepted: true,
            ride: acceptedRide,
        };
    }
}
