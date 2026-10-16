import { IsNumber, IsOptional, Max, Min } from "class-validator";

export class UpdateDriverLocationDto {
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude!: number;

    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude!: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(359.999999)
    heading?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    speedKmh?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    accuracyM?: number;
}
