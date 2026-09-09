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

    @Get("driver/requests")
    @Roles(UserRole.DRIVER)
    getRideRequests() {
        return this.ridesService.getAvailableRideRequests();
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