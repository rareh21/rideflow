import {
    Body,
    Controller,
    Post,
    UseGuards,
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
}