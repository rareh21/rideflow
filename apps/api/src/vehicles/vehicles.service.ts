import {
  ConflictException,
  Injectable,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    dto: CreateVehicleDto,
  ) {
    const driver =
      await this.prisma.driver.findUnique({
        where: {
          userId,
        },
      });

    if (!driver) {
      throw new ConflictException(
        "Driver profile required",
      );
    }

    return this.prisma.vehicle.create({
      data: {
        driverId: driver.id,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        plateNumber: dto.plateNumber,
      },
    });
  }
}