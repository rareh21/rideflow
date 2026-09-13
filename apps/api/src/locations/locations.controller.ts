import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
} from "@nestjs/common";

import { UserRole } from "@prisma/client";

import { LocationsService } from "./locations.service";
import { ResolveLocationDto } from "./dto/resolve-location.dto";
import { ReverseGeocodeDto } from "./dto/reverse-geocode.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("locations")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationsController {
    constructor(
        private readonly locationsService: LocationsService,
    ) {}

    /**
     * Returns Google Places (or DB fallback) autocomplete suggestions.
     */
    @Get("autocomplete")
    @Roles(UserRole.RIDER)
    autocomplete(@Query("q") query = "") {
        return this.locationsService.autocomplete(query);
    }

    /**
     * Resolves a Google Place ID (or DB place ID) to a Location record.
     */
    @Post("resolve")
    @Roles(UserRole.RIDER)
    resolveLocation(@Body() dto: ResolveLocationDto) {
        return this.locationsService.resolveLocation(dto);
    }

    /**
     * Auto-detect location: Reverse-geocodes lat/lng coordinates into a Location record.
     */
    @Post("reverse-geocode")
    @Roles(UserRole.RIDER)
    reverseGeocode(@Body() dto: ReverseGeocodeDto) {
        return this.locationsService.reverseGeocode(dto);
    }
}
