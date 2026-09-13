import { IsNotEmpty, IsString, MaxLength } from "class-validator";

/**
 * Request body for POST /locations/resolve.
 *
 * Accepts a Google Place ID and a human-readable label.
 * The server geocodes the place and creates/finds the Location record.
 * The client never supplies lat/lng.
 */
export class ResolveLocationDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(300)
    placeId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    label!: string;
}
