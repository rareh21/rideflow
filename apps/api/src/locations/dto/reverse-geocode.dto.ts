import { IsNotEmpty, IsNumber } from "class-validator";

export class ReverseGeocodeDto {
    @IsNumber()
    @IsNotEmpty()
    latitude!: number;

    @IsNumber()
    @IsNotEmpty()
    longitude!: number;
}
