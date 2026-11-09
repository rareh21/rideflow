import { IsEnum, IsOptional, IsString } from "class-validator";
import { RideStatus } from "@prisma/client";

export class UpdateRideStatusDto {
    @IsEnum(RideStatus)
    status!: RideStatus;

    @IsOptional()
    @IsString()
    otp?: string;
}