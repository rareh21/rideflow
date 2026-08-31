import {
    Body,
    Controller,
    Post,
    UseGuards,
    Get,
    Param,
} from "@nestjs/common";

import { RidesService } from "./rides.service";
import { CreateRideDto } from "./dto/create-ride.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

import type { AuthUser } from "../auth/types/auth-user.type";
import { UserRole } from "@prisma/client";

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

    @Get(":id")
    @Roles(UserRole.RIDER)
    findOne(
        @Param("id") rideId: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.ridesService.findById(
            rideId,
            user.userId,
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
}