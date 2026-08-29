import {
  Body,
  Controller,
  Post,
  UseGuards,
} from "@nestjs/common";

import { VehiclesService } from "./vehicles.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/types/auth-user.type";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";

@Controller("vehicles")
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(
      user.userId,
      dto,
    );
  }
}