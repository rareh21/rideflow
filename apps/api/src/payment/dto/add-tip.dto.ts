import { IsNumber, IsPositive, Max, Min } from "class-validator";

export class AddTipDto {
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    @Min(1)
    @Max(10000)
    amount?: number;
}
