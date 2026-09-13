import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from "@nestjs/common";

import { RideStatus, UserRole } from "@prisma/client";

import { RidesService } from "./rides.service";
import { CreateRideDto } from "./dto/create-ride.dto";
import { CreateRideQuoteDto } from "./dto/create-ride-quote.dto";
import { CreateRoutePreviewDto } from "./dto/create-route-preview.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

import type { AuthUser } from "../auth/types/auth-user.type";
import { UpdateRideStatusDto } from "./dto/update-ride-status.dto";

@Controller("rides")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RidesController {
    constructor(
        private readonly ridesService: RidesService,
    ) { }

    @Post()
    @Roles(UserRole.RIDER)
    create(
        @CurrentUser() user: AuthUser,
        @Body() dto: CreateRideDto,
    ) {
        return this.ridesService.create(
            user.userId,
            dto,
        );
    }

    /**
     * Returns real road route data (distance, duration, polyline) for a
     * pickup/destination pair WITHOUT creating a Ride record or calculating
     * a fare.
     *
     * Protected by JWT + RIDER role.
     * Declared before /:id routes — NestJS matches routes in declaration order.
     */
    @Post("route-preview")
    @Roles(UserRole.RIDER)
    createRoutePreview(
        @Body() dto: CreateRoutePreviewDto,
    ) {
        return this.ridesService.createRoutePreview(dto);
    }

    /**
     * Returns a server-calculated fare/distance/duration/polyline estimate for
     * the given pickup, destination, and ride type WITHOUT creating a Ride record.
     *
     * Uses real road routing via Google Routes API.
     *
     * Declared before /:id routes — NestJS matches routes in declaration order
     * and a string "quote" would otherwise be captured by the /:id parameter.
     */
    @Post("quote")
    @Roles(UserRole.RIDER)
    createQuote(
        @Body() dto: CreateRideQuoteDto,
    ) {
        return this.ridesService.createQuote(dto);
    }

    @Get("me")
    @Roles(UserRole.RIDER)
    getMyRides(
        @CurrentUser() user: AuthUser,
    ) {
        return this.ridesService.getMyRides(
            user.userId,
        );
    }

    @Get("driver")
    @Roles(UserRole.DRIVER)
    getDriverRides(
        @CurrentUser() user: AuthUser,
    ) {
        return this.ridesService.getDriverRides(
            user.userId,
        );
    }

    @Get("driver/requests")
    @Roles(UserRole.DRIVER)
    getRideRequests(
        @CurrentUser() user: AuthUser,
    ) {
        return this.ridesService.getAvailableRideRequests(
            user.userId,
        );
    }

    @Get(":id")
    @Roles(
        UserRole.RIDER,
        UserRole.DRIVER,
    )
    findOne(
        @Param("id") rideId: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.ridesService.findById(
            rideId,
            user.userId,
        );
    }

    @Patch(":id/status")
    @Roles(
        UserRole.RIDER,
        UserRole.DRIVER,
    )
    updateStatus(
        @Param("id") rideId: string,
        @CurrentUser() user: AuthUser,
        @Body() dto: UpdateRideStatusDto,
    ) {
        return this.ridesService.updateStatus(
            rideId,
            user.userId,
            dto.status,
        );
    }

    @Post(":id/match-driver")
    @Roles(UserRole.ADMIN)
    matchDriver(
        @Param("id") rideId: string,
    ) {
        return this.ridesService.assignDriver(
            rideId,
        );
    }

    @Post(":id/accept")
    @Roles(UserRole.DRIVER)
    acceptRide(
        @Param("id") rideId: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.ridesService.acceptRide(
            rideId,
            user.userId,
        );
    }
}