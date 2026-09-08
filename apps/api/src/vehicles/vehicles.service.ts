import {
    ConflictException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";

@Injectable()
export class VehiclesService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    private async getDriverByUserId(
        userId: string,
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

        return driver;
    }

    async create(
        userId: string,
        dto: CreateVehicleDto,
    ) {
        const driver =
            await this.getDriverByUserId(userId);

        const existingVehicle =
            await this.prisma.vehicle.findUnique({
                where: {
                    driverId: driver.id,
                },
            });

        if (existingVehicle) {
            throw new ConflictException(
                "Vehicle already exists for this driver",
            );
        }

        try {
            return await this.prisma.vehicle.create({
                data: {
                    driverId: driver.id,
                    make: dto.make.trim(),
                    model: dto.model.trim(),
                    year: dto.year,
                    plateNumber: dto.plateNumber
                        .trim()
                        .toUpperCase(),
                },
            });
        } catch (error) {
            /*
             * Vehicle.plateNumber is unique in Prisma.
             */
            if (
                error instanceof Error &&
                error.message.includes(
                    "Unique constraint",
                )
            ) {
                throw new ConflictException(
                    "A vehicle with this plate number already exists",
                );
            }

            throw error;
        }
    }

    async getMyVehicle(userId: string) {
        const driver =
            await this.getDriverByUserId(userId);

        const vehicle =
            await this.prisma.vehicle.findUnique({
                where: {
                    driverId: driver.id,
                },
            });

        if (!vehicle) {
            throw new NotFoundException(
                "Vehicle not found",
            );
        }

        return vehicle;
    }

    async updateMyVehicle(
        userId: string,
        dto: UpdateVehicleDto,
    ) {
        const driver =
            await this.getDriverByUserId(userId);

        const vehicle =
            await this.prisma.vehicle.findUnique({
                where: {
                    driverId: driver.id,
                },
            });

        if (!vehicle) {
            throw new NotFoundException(
                "Vehicle not found",
            );
        }

        try {
            return await this.prisma.vehicle.update({
                where: {
                    id: vehicle.id,
                },
                data: {
                    ...(dto.make !== undefined && {
                        make: dto.make.trim(),
                    }),

                    ...(dto.model !== undefined && {
                        model: dto.model.trim(),
                    }),

                    ...(dto.year !== undefined && {
                        year: dto.year,
                    }),

                    ...(dto.plateNumber !== undefined && {
                        plateNumber: dto.plateNumber
                            .trim()
                            .toUpperCase(),
                    }),
                },
            });
        } catch (error) {
            if (
                error instanceof Error &&
                error.message.includes(
                    "Unique constraint",
                )
            ) {
                throw new ConflictException(
                    "A vehicle with this plate number already exists",
                );
            }

            throw error;
        }
    }
}