import { Injectable } from "@nestjs/common";

import { GoogleRoutesProvider } from "./google-routes.provider";
import type { LatLng, RoutePreview, RoutingProvider } from "./routing.types";

/**
 * Application-level routing service.
 *
 * This is the single DI token that `RidesService` depends on.
 * Swapping the underlying provider (Google → fallback → test mock) requires
 * only changing what is injected here, not touching `RidesService`.
 */
@Injectable()
export class RoutingService implements RoutingProvider {
    constructor(
        private readonly provider: GoogleRoutesProvider,
    ) {}

    getRoute(
        origin: LatLng,
        destination: LatLng,
    ): Promise<RoutePreview> {
        return this.provider.getRoute(origin, destination);
    }
}
