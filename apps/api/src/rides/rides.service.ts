import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
} from "@nestjs/common";

import {
    Prisma,
    RideStatus,
    RideType,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateRideDto } from "./dto/create-ride.dto";
import { CreateRideQuoteDto } from "./dto/create-ride-quote.dto";
import { CreateRoutePreviewDto } from "./dto/create-route-preview.dto";
import { CreateRideReviewDto } from "./dto/create-ride-review.dto";
import { RidesGateway } from "./rides.gateway";
import { RideTimeoutService } from "./ride-timeout.service";
import { canTransitionRideStatus } from "./ride-status";
import { RoutingService } from "./routing/routing.service";
import { calculateFare } from "./utils/fare-calculator";
import { determineVehicleType } from "./utils/vehicle-type";

@Injectable()
export class RidesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly ridesGateway: RidesGateway,
        private readonly rideTimeoutService: RideTimeoutService,
        private readonly routingService: RoutingService,
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
         * Real road distance and driving duration come from the routing provider;
         * the fare formula is unchanged.
         */
        const route = await this.routingService.getRoute(
            {
                latitude: Number(pickupLocation.latitude),
                longitude: Number(pickupLocation.longitude),
            },
            {
                latitude: Number(destinationLocation.latitude),
                longitude: Number(destinationLocation.longitude),
            },
        );

        const { distanceKm, durationMinutes } = route;
        const fare = calculateFare(dto.rideType, distanceKm, durationMinutes);

        // Polyline is transient — not persisted in the Ride record.
        // Route geometry for Active Ride is a separate schema decision (Batch 4+).
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
        this.ridesGateway.emitRideRequestCreated(ride);

        // Start the no-driver-found timer. If no driver accepts within the
        // configured window the ride is auto-cancelled server-side.
        this.rideTimeoutService.scheduleTimeout(ride.id);

        return ride;
    }

    /**
     * Returns an estimated fare/distance/duration/polyline for the given route
     * and ride type WITHOUT creating a Ride record.
     *
     * Uses real road routing via `RoutingService` (Google Routes API).
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

        const route = await this.routingService.getRoute(
            {
                latitude: Number(pickupLocation.latitude),
                longitude: Number(pickupLocation.longitude),
            },
            {
                latitude: Number(destinationLocation.latitude),
                longitude: Number(destinationLocation.longitude),
            },
        );

        const { distanceKm, durationMinutes, encodedPolyline } = route;
        const fare = calculateFare(dto.rideType, distanceKm, durationMinutes);

        return {
            pickupLocation,
            destinationLocation,
            rideType: dto.rideType,
            estimatedDistanceKm: distanceKm,
            estimatedDurationMinutes: durationMinutes,
            estimatedFare: fare,
            currency: "INR",
            encodedPolyline,
        };
    }

    /**
     * Returns real road route data (distance, duration, polyline) for the
     * given pickup and destination WITHOUT creating a Ride record or
     * calculating a fare.
     *
     * Used by the Route Preview step before the rider selects a ride type.
     * Protected by JWT + RIDER role on the controller.
     */
    async createRoutePreview(dto: CreateRoutePreviewDto) {
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

        const route = await this.routingService.getRoute(
            {
                latitude: Number(pickupLocation.latitude),
                longitude: Number(pickupLocation.longitude),
            },
            {
                latitude: Number(destinationLocation.latitude),
                longitude: Number(destinationLocation.longitude),
            },
        );

        return {
            pickupLocation,
            destinationLocation,
            distanceKm: route.distanceKm,
            durationMinutes: route.durationMinutes,
            encodedPolyline: route.encodedPolyline,
            provider: "google",
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

    async getReceipt(
        rideId: string,
        userId: string,
    ) {
        const ride = await this.findById(rideId, userId);

        return {
            rideId: ride.id,
            status: ride.status,
            rideType: ride.rideType,
            pickupLocation: ride.pickupLocation,
            destinationLocation: ride.destinationLocation,
            distanceKm: Number(ride.estimatedDistanceKm),
            durationMinutes: ride.estimatedDurationMinutes,
            fare: Number(ride.estimatedFare),
            currency: "INR" as const,
            paymentMethod: ride.paymentMethod ?? "UPI",
            completedAt: ride.completedAt ?? (ride.status === RideStatus.COMPLETED ? ride.updatedAt : null),
        };
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
                RideStatus.DRIVER_ARRIVED,
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
        if (ride.status === RideStatus.SEARCHING_DRIVER) {
            this.ridesGateway.emitRideRequestRemoved(rideId);
        }

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
                                ...(nextStatus === RideStatus.COMPLETED ? { completedAt: ride.completedAt ?? new Date() } : {}),
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

                    if (nextStatus === RideStatus.COMPLETED) {
                        const method = ride.paymentMethod ?? "UPI";
                        const providerPaymentId = method === "CASH" ? null : `mock_pay_${ride.id.replace(/-/g, "").slice(0, 12)}`;
                        await tx.payment.upsert({
                            where: { rideId: ride.id },
                            create: {
                                rideId: ride.id,
                                userId: ride.riderId,
                                amount: ride.estimatedFare,
                                currency: "INR",
                                method,
                                status: "SUCCEEDED",
                                provider: method === "CASH" ? null : "mock",
                                providerPaymentId,
                            },
                            update: {
                                status: "SUCCEEDED",
                                provider: method === "CASH" ? null : "mock",
                                providerPaymentId,
                            },
                        });
                    }

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

    async getAvailableRideRequests(userId?: string) {
        let vehicleType: RideType | undefined;

        if (userId) {
            const driver = await this.prisma.driver.findUnique({
                where: { userId },
                select: {
                    status: true,
                    vehicle: {
                        select: {
                            make: true,
                            model: true,
                        },
                    },
                },
            });

            if (!driver || driver.status !== "AVAILABLE") {
                return [];
            }

            if (!driver.vehicle) {
                // Driver has no registered vehicle — cannot accept ride requests
                return [];
            }

            vehicleType = determineVehicleType(driver.vehicle.make, driver.vehicle.model);
        }

        const expiryMinutes = Number(process.env.RIDE_REQUEST_EXPIRY_MINUTES) || 10;
        const cutoff = new Date(Date.now() - expiryMinutes * 60 * 1000);

        return this.prisma.ride.findMany({
            where: {
                status: RideStatus.SEARCHING_DRIVER,
                driverId: null,
                ...(vehicleType ? { rideType: vehicleType } : {}),
                createdAt: {
                    gte: cutoff,
                },
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
            include: {
                vehicle: true,
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

        if (!driver.vehicle) {
            throw new BadRequestException(
                "You must register a vehicle before accepting rides",
            );
        }

        const driverVehicleType = determineVehicleType(
            driver.vehicle.make,
            driver.vehicle.model,
        );

        const targetRide = await this.prisma.ride.findUnique({
            where: { id: rideId },
            select: { rideType: true },
        });

        if (targetRide && targetRide.rideType !== driverVehicleType) {
            throw new BadRequestException(
                `Your vehicle type (${driverVehicleType}) does not match this ride request (${targetRide.rideType})`,
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
                        "You are currently handling another ride",
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
                        "This ride is no longer available",
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
            this.ridesGateway.emitRideRequestRemoved(rideId);
        }

        return {
            accepted: true,
            ride: acceptedRide,
        };
    }

    async getDriverCurrentRide(userId: string) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!driver) {
            throw new NotFoundException("Driver profile not found");
        }

        const currentRide = await this.prisma.ride.findFirst({
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

        return currentRide ?? null;
    }

    async createReview(
        userId: string,
        rideId: string,
        dto: CreateRideReviewDto,
    ) {
        const ride = await this.prisma.ride.findUnique({
            where: { id: rideId },
            include: {
                driver: {
                    select: {
                        userId: true,
                    },
                },
            },
        });

        if (!ride) {
            throw new NotFoundException("Ride not found");
        }

        if (ride.status !== RideStatus.COMPLETED) {
            throw new BadRequestException("This ride cannot be reviewed until it is completed.");
        }

        let revieweeId: string;

        if (ride.riderId === userId) {
            // Rider is reviewing the driver
            if (!ride.driverId || !ride.driver || !ride.driver.userId) {
                throw new BadRequestException("This ride does not have an assigned driver to review.");
            }
            revieweeId = ride.driver.userId;
        } else if (ride.driver && ride.driver.userId === userId) {
            // Driver is reviewing the rider
            revieweeId = ride.riderId;
        } else {
            throw new ForbiddenException("You can only review rides you participated in.");
        }

        if (userId === revieweeId) {
            throw new BadRequestException("You cannot review yourself.");
        }

        const existingReview = await this.prisma.rideReview.findUnique({
            where: {
                rideId_reviewerId: {
                    rideId,
                    reviewerId: userId,
                },
            },
        });

        if (existingReview) {
            throw new ConflictException("You have already reviewed this ride.");
        }

        const trimmedComment = dto.comment?.trim() || null;

        try {
            return await this.prisma.rideReview.create({
                data: {
                    rideId,
                    reviewerId: userId,
                    revieweeId,
                    rating: dto.rating,
                    comment: trimmedComment,
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                throw new ConflictException("You have already reviewed this ride.");
            }
            throw error;
        }
    }

    async getReview(userId: string, rideId: string) {
        const review = await this.prisma.rideReview.findUnique({
            where: {
                rideId_reviewerId: {
                    rideId,
                    reviewerId: userId,
                },
            },
        });

        return review ?? null;
    }

    async getUserRatingSummary(userId: string) {
        const aggregate = await this.prisma.rideReview.aggregate({
            where: { revieweeId: userId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        const totalRatings = aggregate._count.rating;
        const averageRating =
            totalRatings > 0 && aggregate._avg.rating !== null
                ? Math.round(aggregate._avg.rating * 10) / 10
                : null;

        return {
            averageRating,
            totalRatings,
        };
    }
}
