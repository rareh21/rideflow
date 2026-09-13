import {
    IsEnum,
    IsOptional,
    IsUUID,
} from "class-validator";
import { PaymentMethod, RideType } from "@prisma/client";

/**
 * Fields accepted when creating a new ride.
 *
 * estimatedFare, estimatedDistanceKm, estimatedDurationMinutes are
 * intentionally absent — the server calculates these values independently
 * and never trusts client-supplied financial data.
 */
export class CreateRideDto {
    @IsUUID()
    pickupLocationId!: string;

    @IsUUID()
    destinationLocationId!: string;

    @IsEnum(RideType)
    rideType!: RideType;

    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;
}