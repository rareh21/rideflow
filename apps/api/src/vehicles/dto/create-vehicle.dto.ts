import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from "class-validator";

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  make!: string;

  @IsString()
  @IsNotEmpty()
  model!: string;

  @IsInt()
  @Min(1990)
  @Max(2100)
  year!: number;

  @IsString()
  @IsNotEmpty()
  plateNumber!: string;
}