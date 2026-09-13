/**
 * Normalized route result returned by any routing provider.
 *
 * All downstream code (RidesService, fare calculator) depends on this type,
 * never on a provider-specific response format.
 */
export type RoutePreview = {
    /** Road distance in kilometres. */
    distanceKm: number;

    /** Estimated driving duration in minutes (ceiling-rounded). */
    durationMinutes: number;

    /** Google-encoded polyline string for route visualization. May be absent
     *  if the provider does not return one. */
    encodedPolyline?: string;
};

/**
 * Coordinate pair accepted by a routing provider.
 */
export type LatLng = {
    latitude: number;
    longitude: number;
};

/**
 * Contract that every routing provider must implement.
 *
 * `RidesService` depends only on this interface — the concrete implementation
 * (Google Routes, fallback, mock) is injected via `RoutingService`.
 */
export interface RoutingProvider {
    getRoute(
        origin: LatLng,
        destination: LatLng,
    ): Promise<RoutePreview>;
}
