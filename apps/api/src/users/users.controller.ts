import {
	Body,
	Controller,
	Get,
	Patch,
	UseGuards,
	Request,
	Post,
	Delete,
	Param,
} from "@nestjs/common";

import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import type { AuthUser } from "../auth/types/auth-user.type";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";
import { CreateSavedPlaceDto } from "./dto/create-saved-place.dto";
import { UpdateSavedPlaceDto } from "./dto/update-saved-place.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

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

	@Get("me/saved-places")
	async getSavedPlaces(
		@CurrentUser() user: AuthUser,
	) {
		return this.usersService.getSavedPlaces(user.userId);
	}

	@Post("me/saved-places")
	async createSavedPlace(
		@CurrentUser() user: AuthUser,
		@Body() dto: CreateSavedPlaceDto,
	) {
		return this.usersService.createSavedPlace(
			user.userId,
			dto,
		);
	}

	@Patch("me/saved-places/:placeId")
	async updateSavedPlace(
		@CurrentUser() user: AuthUser,
		@Param("placeId") placeId: string,
		@Body() dto: UpdateSavedPlaceDto,
	) {
		return this.usersService.updateSavedPlace(
			user.userId,
			placeId,
			dto,
		);
	}

	@Delete("me/saved-places/:placeId")
	async deleteSavedPlace(
		@CurrentUser() user: AuthUser,
		@Param("placeId") placeId: string,
	) {
		return this.usersService.deleteSavedPlace(
			user.userId,
			placeId,
		);
	}

	@Patch("me/security/password")
	async changePassword(
		@CurrentUser() user: AuthUser,
		@Body() dto: ChangePasswordDto,
	) {
		return this.usersService.changePassword(
			user.userId,
			dto,
		);
	}
}