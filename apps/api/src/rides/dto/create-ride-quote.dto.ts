import {
    IsEnum,
    IsUUID,
} from "class-validator";
import { RideType } from "@prisma/client";

/**
 * Request body for POST /rides/quote.
 *
 * Only accepts location IDs and ride type — the server calculates all
 * financial values (fare, distance, duration) independently.
 */
export class CreateRideQuoteDto {
    @IsUUID()
    pickupLocationId!: string;

    @IsUUID()
    destinationLocationId!: string;

    @IsEnum(RideType)
    rideType!: RideType;
}
