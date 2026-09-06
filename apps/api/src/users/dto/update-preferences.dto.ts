import {
    IsBoolean,
    IsEnum,
    IsOptional,
} from "class-validator";
import { PaymentMethod } from "@prisma/client";

export class UpdatePreferencesDto {
    @IsOptional()
    @IsEnum(PaymentMethod)
    defaultPaymentMethod?: PaymentMethod;

    @IsOptional()
    @IsBoolean()
    rideNotificationsEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    promotionalNotificationsEnabled?: boolean;
}