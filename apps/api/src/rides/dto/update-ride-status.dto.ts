import { IsEnum } from "class-validator";
import { RideStatus } from "@prisma/client";

export class UpdateRideStatusDto {
    @IsEnum(RideStatus)
    status!: RideStatus;
}