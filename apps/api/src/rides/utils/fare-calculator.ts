import { RideType } from "@prisma/client";

/**
 * Server-side fare configuration.
 *
 * All monetary values are in Indian Rupees (INR).
 *
 * Keep this config isolated — a future dynamic pricing service will
 * replace or override these static values.
 */
const FARE_CONFIG: Record<
    RideType,
    { baseFare: number; perKm: number; perMinute: number }
> = {
    GO: {
        baseFare: 50,
        perKm: 12,
        perMinute: 1.5,
    },
    PLUS: {
        baseFare: 75,
        perKm: 15,
        perMinute: 2,
    },
    XL: {
        baseFare: 100,
        perKm: 20,
        perMinute: 2.5,
    },
};

/**
 * Calculates the estimated fare for a ride.
 *
 * Formula: baseFare + distanceKm × perKm + durationMinutes × perMinute
 * Result is rounded to the nearest whole INR.
 *
 * @param rideType   - Ride category (GO / PLUS / XL)
 * @param distanceKm - Trip distance in kilometres
 * @param durationMinutes - Estimated trip duration in minutes
 * @returns Fare amount in INR (integer)
 */
export function calculateFare(
    rideType: RideType,
    distanceKm: number,
    durationMinutes: number,
): number {
    const config = FARE_CONFIG[rideType];

    const fare =
        config.baseFare +
        distanceKm * config.perKm +
        durationMinutes * config.perMinute;

    return Math.round(fare);
}
