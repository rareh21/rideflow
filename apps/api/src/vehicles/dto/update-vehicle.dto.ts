import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    Min,
} from "class-validator";

export class UpdateVehicleDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    make?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    model?: string;

    @IsOptional()
    @IsInt()
    @Min(1990)
    @Max(2100)
    year?: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    plateNumber?: string;
}