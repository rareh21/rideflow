import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { CancellationReason } from "@prisma/client";

export class CancelRideDto {
    @IsEnum(CancellationReason)
    @IsOptional()
    reason?: CancellationReason;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    note?: string;
}
