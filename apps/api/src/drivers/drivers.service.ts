import {
    ConflictException,
    Injectable,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateDriverDto } from "./dto/create-driver.dto";
import { DriverStatus } from "../../generated/prisma/client";

@Injectable()
export class DriversService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async createDriver(
        userId: string,
        dto: CreateDriverDto,
    ) {
        const existingDriver =
            await this.prisma.driver.findUnique({
                where: {
                    userId,
                },
            });

        if (existingDriver) {
            throw new ConflictException(
                "Driver profile already exists",
            );
        }

        return this.prisma.driver.create({
            data: {
                userId,
                licenseNumber: dto.licenseNumber,
            },
            select: {
                id: true,
                userId: true,
                licenseNumber: true,
                status: true,
                createdAt: true,
            },
        });
    }

    async updateStatus(
        userId: string,
        status: DriverStatus,
    ) {
        return this.prisma.driver.update({
            where: {
                userId,
            },
            data: {
                status,
            },
            select: {
                id: true,
                status: true,
            },
        });
    }
}