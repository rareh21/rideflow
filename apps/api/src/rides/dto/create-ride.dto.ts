import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { PaymentMethod, RideType } from "@prisma/client";

export class CreateRideDto {
  @IsUUID()
  pickupLocationId: string;

  @IsUUID()
  destinationLocationId: string;

  @IsEnum(RideType)
  rideType: RideType;

  @IsNumber()
  @Min(0)
  estimatedFare: number;

  @IsNumber()
  @Min(0)
  estimatedDistanceKm: number;

  @IsNumber()
  @Min(0)
  estimatedDurationMinutes: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}