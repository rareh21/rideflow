import {
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateDriverApplicationDto {
  @IsString()
  @MinLength(5)
  licenseNumber!: string;

  @IsOptional()
  @IsString()
  additionalInformation?: string;
}