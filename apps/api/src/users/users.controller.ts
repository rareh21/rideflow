import {
	Body,
	Controller,
	Get,
	Patch,
	UseGuards,
	Request,
} from "@nestjs/common";

import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import type { AuthUser } from "../auth/types/auth-user.type";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
	) { }

	@Get("me")
	getProfile(@CurrentUser() user: AuthUser) {
		return this.usersService.findById(user.userId);
	}

	@Patch("me")
	updateMe(
		@Request() req: any,
		@Body() dto: UpdateProfileDto,
	) {
		return this.usersService.updateProfile(
			req.user.userId,
			dto,
		);
	}

	@Get("me/preferences")
	getPreferences(@Request() req: any) {
		return this.usersService.getPreferences(
			req.user.userId,
		);
	}

	@Patch("me/preferences")
	updatePreferences(
		@Request() req: any,
		@Body() dto: UpdatePreferencesDto,
	) {
		return this.usersService.updatePreferences(
			req.user.userId,
			dto,
		);
	}
}