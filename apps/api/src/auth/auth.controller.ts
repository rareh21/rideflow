import { Body, Controller, Get, Post, UseGuards, Request } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { AuthUser } from "./types/auth-user.type";
import { CurrentUser } from "./decorators/current-user.decorator";
import { RolesGuard } from "./guards/roles.guard";
import { UserRole } from "@prisma/client";
import { Roles } from "./decorators/roles.decorator";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("register")
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post("login")
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }


    @Get("me")
    @UseGuards(JwtAuthGuard)
    me(@CurrentUser() user: AuthUser) {
        return {
            user,
            message: "You are authenticated",
        };
    }

    @Get("driver-test")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.DRIVER)
    driverTest() {
        return {
            message: "Driver access granted",
        };
    }

    @Get("admin-test")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    adminTest() {
        return {
            message: "Admin authorization successful",
        };
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout(@CurrentUser() user: AuthUser) {
        return this.authService.logout(user.userId);
    }
}