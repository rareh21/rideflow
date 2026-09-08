import {
    Body,
    Controller,
    Get,
    Patch,
    Post,
    UseGuards,
} from "@nestjs/common";

import { VehiclesService } from "./vehicles.service";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

import type { AuthUser } from "../auth/types/auth-user.type";

import { UserRole } from "@prisma/client";

import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";

@Controller("vehicles")
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
    constructor(
        private readonly vehiclesService: VehiclesService,
    ) { }

    @Post()
    @Roles(UserRole.DRIVER)
    create(
        @CurrentUser() user: AuthUser,
        @Body() dto: CreateVehicleDto,
    ) {
        return this.vehiclesService.create(
            user.userId,
            dto,
        );
    }

    @Get("me")
    @Roles(UserRole.DRIVER)
    getMyVehicle(
        @CurrentUser() user: AuthUser,
    ) {
        return this.vehiclesService.getMyVehicle(
            user.userId,
        );
    }

    @Patch("me")
    @Roles(UserRole.DRIVER)
    updateMyVehicle(
        @CurrentUser() user: AuthUser,
        @Body() dto: UpdateVehicleDto,
    ) {
        return this.vehiclesService.updateMyVehicle(
            user.userId,
            dto,
        );
    }
}