import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { PaymentService } from "./payment.service";
import { RefundService } from "./refund.service";
import { ProcessPaymentDto } from "./dto/process-payment.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/types/auth-user.type";

@Controller("payments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly refundService: RefundService,
    ) { }

    @Post("ride/:rideId")
    @Roles(UserRole.RIDER)
    createPaymentForRide(
        @Param("rideId") rideId: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.paymentService.createPaymentForRide(
            rideId,
            user.userId,
        );
    }

    @Get("ride/:rideId")
    @Roles(UserRole.RIDER, UserRole.DRIVER, UserRole.ADMIN)
    getPaymentForRide(
        @Param("rideId") rideId: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.paymentService.getPaymentForRide(
            rideId,
            user.userId,
        );
    }

    @Get("ride/:rideId/refund")
    @Roles(UserRole.RIDER, UserRole.DRIVER, UserRole.ADMIN)
    getRefundForRide(
        @Param("rideId") rideId: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.refundService.getRefundForRide(
            rideId,
            user.userId,
            user.role as UserRole,
        );
    }

    @Get("me")
    @Roles(UserRole.RIDER)
    getMyPayments(@CurrentUser() user: AuthUser) {
        return this.paymentService.getMyPayments(user.userId);
    }

    @Get(":id/refund")
    @Roles(UserRole.RIDER, UserRole.DRIVER, UserRole.ADMIN)
    getRefundById(
        @Param("id") id: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.refundService.getRefundById(
            id,
            user.userId,
            user.role as UserRole,
        );
    }

    @Get(":id")
    @Roles(UserRole.RIDER, UserRole.ADMIN)
    getPaymentById(
        @Param("id") id: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.paymentService.getPaymentById(
            id,
            user.userId,
        );
    }

    @Post(":id/process")
    @Roles(UserRole.RIDER)
    processPayment(
        @Param("id") id: string,
        @CurrentUser() user: AuthUser,
        @Body() dto: ProcessPaymentDto,
    ) {
        return this.paymentService.processPayment(
            id,
            user.userId,
            dto.simulateResult,
        );
    }
}
