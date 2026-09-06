import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class ReviewDriverApplicationDto {
  @IsIn(["APPROVED", "REJECTED"])
  status!: "APPROVED" | "REJECTED";

  @IsOptional()
  @IsString()
  @MinLength(5)
  rejectionReason?: string;
}