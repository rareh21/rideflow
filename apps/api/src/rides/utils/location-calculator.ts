/**
 * Server-side location/distance utilities.
 *
 * Currently uses straight-line Haversine distance because road routing has
 * not yet been implemented.  The Route Preview module will replace
 * `haversineDistanceKm` with a road-distance/ETA call — keep this file
 * isolated so that replacement is a single-file change.
 */

const EARTH_RADIUS_KM = 6371;

/** Average city speed used for straight-line ETA estimation. */
const AVERAGE_SPEED_KM_H = 25;

function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

/**
 * Returns the great-circle distance (km) between two lat/lng points.
 *
 * @remarks
 * Haversine formula — accurate to ~0.5 % for the distances typical in
 * urban ride-sharing.
 */
export function haversineDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
}

/**
 * Estimates trip duration (minutes) from a straight-line distance.
 *
 * Minimum of 1 minute is enforced so very short trips still receive a
 * sensible ETA.
 *
 * @remarks
 * Uses `AVERAGE_SPEED_KM_H` (25 km/h) which the Route Preview module
 * will replace with an actual road-network ETA.
 */
export function estimatedDurationMinutes(distanceKm: number): number {
    return Math.max(1, Math.ceil((distanceKm / AVERAGE_SPEED_KM_H) * 60));
}
