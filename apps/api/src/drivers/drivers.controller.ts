import {
    Body,
    Controller,
    Post,
    UseGuards,
    Get,
    Param,
    Patch,
    Request
} from "@nestjs/common";

import { DriversService } from "./drivers.service";
import { CreateDriverDto } from "./dto/create-driver.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

import { UserRole } from "@prisma/client";
import { CreateDriverApplicationDto } from "./dto/create-driver-application.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/types/auth-user.type";
import { ReviewDriverApplicationDto } from "./dto/review-driver-application.dto";
import { UpdateDriverStatusDto } from "./dto/update-driver-status.dto";

@Controller("drivers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
    constructor(
        private readonly driversService: DriversService,
    ) { }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() dto: CreateDriverDto) {
        return this.driversService.create(dto);
    }

    @Post("application")
    @Roles(
        UserRole.RIDER,
        UserRole.DRIVER,
    )
    apply(
        @CurrentUser() user: AuthUser,
        @Body() dto: CreateDriverApplicationDto,
    ) {
        return this.driversService.apply(
            user.userId,
            dto,
        );
    }

    @Get("application")
    @Roles(
        UserRole.RIDER,
        UserRole.DRIVER,
    )
    getApplication(
        @CurrentUser() user: AuthUser,
    ) {
        return this.driversService.getApplication(
            user.userId,
        );
    }

    @Get("applications")
    @Roles(UserRole.ADMIN)
    getApplications() {
        return this.driversService.getApplications();
    }

    @Get("applications/:id")
    @Roles(UserRole.ADMIN)
    getApplicationById(@Param("id") id: string) {
        return this.driversService.getApplication(id);
    }

    @Patch("applications/:id/review")
    @Roles(UserRole.ADMIN)
    reviewApplication(
        @Param("id") id: string,
        @Body() dto: ReviewDriverApplicationDto,
        @Request() req: any,
    ) {
        return this.driversService.reviewApplication(
            id,
            req.user.userId,
            dto,
        );
    }

    @Get('me')
    @Roles(UserRole.DRIVER)
    getMyDriver(@CurrentUser() user: AuthUser) {
        return this.driversService.getMyDriver(user.userId);
    }


    @Get("me/status")
    @Roles(UserRole.DRIVER)
    getMyStatus(
        @CurrentUser() user: AuthUser,
    ) {
        return this.driversService.getMyStatus(
            user.userId,
        );
    }

    @Patch('me/status')
    @Roles(UserRole.DRIVER)
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
