import {
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from "class-validator";

export class CreateRideReviewDto {
    @IsInt({ message: "Rating must be an integer between 1 and 5" })
    @Min(1, { message: "Rating must be at least 1" })
    @Max(5, { message: "Rating cannot exceed 5" })
    rating: number;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: "Comment cannot exceed 500 characters" })
    comment?: string;
}
