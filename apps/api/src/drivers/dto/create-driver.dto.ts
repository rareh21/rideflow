import {
  IsOptional,
  IsString,
} from "class-validator";

export class CreateDriverDto {
  @IsOptional()
  @IsString()
  licenseNumber?: string;
}