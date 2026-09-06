import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateSavedPlaceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  label!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address!: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;
}