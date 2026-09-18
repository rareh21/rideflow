import { IsEnum, IsOptional } from "class-validator";

export enum PaymentSimulationResult {
    SUCCESS = "success",
    FAILURE = "failure",
}

export class ProcessPaymentDto {
    @IsOptional()
    @IsEnum(PaymentSimulationResult)
    simulateResult?: PaymentSimulationResult;
}
