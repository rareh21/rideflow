import { IsUUID } from "class-validator";

/**
 * Request body for POST /rides/route-preview.
 *
 * Accepts only location IDs — no distance, duration, fare, or polyline.
 * All route data is calculated server-side.
 */
export class CreateRoutePreviewDto {
    @IsUUID()
    pickupLocationId!: string;

    @IsUUID()
    destinationLocationId!: string;
}
