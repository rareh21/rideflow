import { Injectable, Logger } from "@nestjs/common";

import { RideStatus } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { RidesGateway } from "./rides.gateway";

/**
 * How long (in milliseconds) the platform waits for a driver to accept a
 * SEARCHING_DRIVER ride before automatically cancelling it.
 *
 * Default: 120 000 ms (2 minutes). Override with the
 * RIDE_SEARCH_TIMEOUT_SECONDS environment variable.
 */
const SEARCH_TIMEOUT_MS =
    (Number(process.env.RIDE_SEARCH_TIMEOUT_SECONDS) || 120) * 1_000;

@Injectable()
export class RideTimeoutService {
    private readonly logger = new Logger(RideTimeoutService.name);

    /**
     * Active timers keyed by rideId.
     * Allows cancellation when a driver accepts or the rider cancels manually.
     */
    private readonly timers = new Map<string, NodeJS.Timeout>();

    constructor(
        private readonly prisma: PrismaService,
        private readonly ridesGateway: RidesGateway,
    ) {}

    /**
     * Schedule an automatic cancellation for the given ride.
     * Safe to call multiple times — a second call for the same rideId
     * replaces the existing timer.
     */
    scheduleTimeout(rideId: string): void {
        // Clear any pre-existing timer for this ride.
        this.cancelTimer(rideId);

        const timer = setTimeout(
            () => void this.expireRide(rideId),
            SEARCH_TIMEOUT_MS,
        );

        this.timers.set(rideId, timer);

        this.logger.debug(
            `Search timeout scheduled for ride ${rideId} ` +
            `(${SEARCH_TIMEOUT_MS / 1000} s)`,
        );
    }

    /**
     * Clear the pending timeout for a ride.
     * Call this whenever the ride leaves SEARCHING_DRIVER through any other path
     * (driver accepted, rider cancelled manually).
     */
    cancelTimer(rideId: string): void {
        const existing = this.timers.get(rideId);

        if (existing !== undefined) {
            clearTimeout(existing);
            this.timers.delete(rideId);
            this.logger.debug(`Search timeout cleared for ride ${rideId}`);
        }
    }

    /**
     * Fired by the timer. Atomically cancels the ride only if it is still
     * waiting for a driver (guards against a driver accepting between the
     * timer fire and the DB write).
     */
    private async expireRide(rideId: string): Promise<void> {
        // Remove from map — the timer has already fired.
        this.timers.delete(rideId);

        this.logger.log(
            `Search timeout elapsed for ride ${rideId}; attempting auto-cancel`,
        );

        try {
            const cancelled = await this.prisma.$transaction(async (tx) => {
                /*
                 * updateMany with a status condition acts as an optimistic
                 * lock: it only updates (and counts 1) when the ride is still
                 * in SEARCHING_DRIVER with no driver assigned.
                 */
                const result = await tx.ride.updateMany({
                    where: {
                        id: rideId,
                        status: RideStatus.SEARCHING_DRIVER,
                        driverId: null,
                    },
                    data: {
                        status: RideStatus.CANCELLED,
                    },
                });

                if (result.count === 0) {
                    // Race: ride was already accepted or cancelled — nothing to do.
                    return null;
                }

                // Fetch the full ride record for the socket payload.
                return tx.ride.findUnique({
                    where: { id: rideId },
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
                                userId: true,
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
            });

            if (!cancelled) {
                this.logger.debug(
                    `Ride ${rideId} was no longer in SEARCHING_DRIVER — ` +
                    "auto-cancel skipped",
                );
                return;
            }

            this.logger.log(`Ride ${rideId} auto-cancelled (no driver accepted)`);

            /*
             * Broadcast the cancellation so:
             *   - The rider's socket receives ride.updated → CANCELLED and the
             *     UI shows the timeout message.
             *   - The ride.requests.changed broadcast removes the ride from
             *     every driver's queue (handled inside emitRideUpdated).
             */
            this.ridesGateway.emitRideUpdated(
                cancelled.riderId,
                cancelled.driver?.userId ?? cancelled.driver?.user?.id ?? null,
                {
                    rideId: cancelled.id,
                    status: cancelled.status,
                    ride: cancelled,
                },
            );
        } catch (err) {
            this.logger.error(
                `Failed to auto-cancel ride ${rideId}`,
                err instanceof Error ? err.stack : String(err),
            );
        }
    }
}
