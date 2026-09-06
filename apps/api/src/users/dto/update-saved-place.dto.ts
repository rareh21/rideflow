import {
    IsLatitude,
    IsLongitude,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from "class-validator";

export class UpdateSavedPlaceDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    label?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(300)
    address?: string;

    @IsOptional()
    @IsLatitude()
    latitude?: number;

    @IsOptional()
    @IsLongitude()
    longitude?: number;
}