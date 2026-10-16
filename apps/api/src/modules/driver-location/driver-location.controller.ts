import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import type { AuthUser } from "../../auth/types/auth-user.type";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { DriverLocationService } from "./driver-location.service";
import { UpdateDriverLocationDto } from "./dto/update-driver-location.dto";

@Controller("drivers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriverLocationController {
    constructor(
        private readonly driverLocationService: DriverLocationService,
    ) { }

    @Patch("me/location")
    @Roles(UserRole.DRIVER)
    updateLocation(
        @CurrentUser() user: AuthUser,
        @Body() dto: UpdateDriverLocationDto,
    ) {
        return this.driverLocationService.updateDriverLocation(
            user.userId,
            dto,
        );
    }
}

@Controller("rides")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RideDriverLocationController {
    constructor(
        private readonly driverLocationService: DriverLocationService,
    ) { }

    @Get(":rideId/driver-location")
    @Roles(UserRole.RIDER, UserRole.DRIVER)
    getRideDriverLocation(
        @Param("rideId") rideId: string,
        @CurrentUser() user: AuthUser,
    ) {
        return this.driverLocationService.getRideDriverLocation(
            rideId,
            user.userId,
        );
    }
}
