import {
    Body,
    Controller,
    Post,
    UseGuards,
    Patch,
} from "@nestjs/common";

import { DriversService } from "./drivers.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/types/auth-user.type";
import { CreateDriverDto } from "./dto/create-driver.dto";
import { UpdateDriverStatusDto } from "./dto/update-driver-status.dto";

@Controller("drivers")
@UseGuards(JwtAuthGuard)
export class DriversController {
    constructor(
        private readonly driversService: DriversService,
    ) { }

    @Post("me")
    createDriver(
        @CurrentUser() user: AuthUser,
        @Body() dto: CreateDriverDto,
    ) {
        return this.driversService.createDriver(
            user.userId,
            dto,
        );
    }

    @Patch("me/status")
    updateStatus(
        @CurrentUser() user: AuthUser,
        @Body() dto: UpdateDriverStatusDto,
    ) {
        return this.driversService.updateStatus(
            user.userId,
            dto.status,
        );
    }
}