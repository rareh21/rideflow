import {
    ConflictException,
    Injectable,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";

import * as bcrypt from "bcrypt";

import { PrismaService } from "../prisma/prisma.service";
import { CreateDriverDto } from "./dto/create-driver.dto";
import { CreateDriverApplicationDto } from "./dto/create-driver-application.dto";
import { ReviewDriverApplicationDto } from "./dto/review-driver-application.dto";
import { DriverStatus, UserRole } from "@prisma/client";

@Injectable()
export class DriversService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async create(dto: CreateDriverDto) {
        const existingUser =
            await this.prisma.user.findUnique({
                where: {
                    email: dto.email,
                },
            });

        if (existingUser) {
            throw new ConflictException(
                "Email already registered",
            );
        }

        const existingLicense =
            await this.prisma.driver.findUnique({
                where: {
                    licenseNumber: dto.licenseNumber,
                },
            });

        if (existingLicense) {
            throw new ConflictException(
                "License number already registered",
            );
        }

        const passwordHash =
            await bcrypt.hash(dto.password, 12);

        return this.prisma.$transaction(
            async (tx) => {
                const user = await tx.user.create({
                    data: {
                        name: dto.name,
                        email: dto.email,
                        passwordHash,
                        role: "DRIVER",
                    },
                });

                const driver = await tx.driver.create({
                    data: {
                        userId: user.id,
                        licenseNumber:
                            dto.licenseNumber,
                        status: "OFFLINE",
                    },
                });

                return {
                    id: driver.id,
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    licenseNumber:
                        driver.licenseNumber,
                    status: driver.status,
                };
            },
        );
    }
    async apply(
        userId: string,
        dto: CreateDriverApplicationDto,
    ) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                role: true,
                driver: {
                    select: {
                        id: true,
                    },
                },
                driverApplication: {
                    select: {
                        id: true,
                        status: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException(
                "User not found",
            );
        }

        if (user.driver) {
            throw new ConflictException(
                "User is already a driver",
            );
        }

        if (user.driverApplication) {
            throw new ConflictException(
                `Driver application already exists with status ${user.driverApplication.status}`,
            );
        }

        return this.prisma.driverApplication.create({
            data: {
                userId,
                licenseNumber: dto.licenseNumber,
            },
        });
    }

    async getApplication(userId: string) {
        const application =
            await this.prisma.driverApplication.findUnique({
                where: {
                    userId,
                },
                select: {
                    id: true,
                    status: true,
                    licenseNumber: true,
                    rejectionReason: true,
                    reviewedAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        if (!application) {
            throw new NotFoundException(
                "Driver application not found",
            );
        }

        return application;
    }

    async getApplications() {
        return this.prisma.driverApplication.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true,
                    },
                },
            },
        });
    }

    async getApplicationById(id: string) {
        const application =
            await this.prisma.driverApplication.findUnique({
                where: {
                    id,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            createdAt: true,
                        },
                    },
                },
            });

        if (!application) {
            throw new NotFoundException(
                "Driver application not found",
            );
        }

        return application;
    }

    async reviewApplication(
        applicationId: string,
        adminId: string,
        dto: ReviewDriverApplicationDto,
    ) {
        const application =
            await this.prisma.driverApplication.findUnique({
                where: {
                    id: applicationId,
                },
                include: {
                    user: true,
                },
            });

        if (!application) {
            throw new NotFoundException(
                "Driver application not found",
            );
        }

        if (application.status !== "PENDING") {
            throw new BadRequestException(
                "This driver application has already been reviewed",
            );
        }

        if (
            dto.status === "REJECTED" &&
            !dto.rejectionReason?.trim()
        ) {
            throw new BadRequestException(
                "Rejection reason is required",
            );
        }

        return this.prisma.$transaction(async (tx) => {
            if (dto.status === "APPROVED") {
                const driver = await tx.driver.create({
                    data: {
                        userId: application.userId,
                        licenseNumber: application.licenseNumber,
                        status: "OFFLINE",
                    },
                });

                await tx.user.update({
                    where: {
                        id: application.userId,
                    },
                    data: {
                        role: UserRole.DRIVER,
                    },
                });

                return tx.driverApplication.update({
                    where: {
                        id: application.id,
                    },
                    data: {
                        status: "APPROVED",
                        reviewedAt: new Date(),
                        reviewedById: adminId,
                        rejectionReason: null,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                });
            }

            return tx.driverApplication.update({
                where: {
                    id: application.id,
                },
                data: {
                    status: "REJECTED",
                    rejectionReason: dto.rejectionReason!.trim(),
                    reviewedAt: new Date(),
                    reviewedById: adminId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            });
        });
    }

    async getMyDriver(userId: string) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                vehicle: true,
            },
        });

        if (!driver) {
            throw new NotFoundException('Driver profile not found');
        }

        return driver;
    }

    async updateStatus(
        userId: string,
        requestedStatus: DriverStatus,  
    ) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
        });

        if (!driver) {
            throw new NotFoundException('Driver profile not found');
        }

        if (driver.status === requestedStatus) {
            return driver;
        }

        const allowedTransitions: Record<
            DriverStatus,
            DriverStatus[]
        > = {
            OFFLINE: [DriverStatus.AVAILABLE],
            AVAILABLE: [
                DriverStatus.OFFLINE,
                DriverStatus.BUSY,
            ],
            BUSY: [DriverStatus.AVAILABLE],
        };

        if (
            !allowedTransitions[driver.status].includes(
                requestedStatus,
            )
        ) {
            throw new BadRequestException(
                `Invalid driver status transition: ${driver.status} → ${requestedStatus}`,
            );
        }

        return this.prisma.driver.update({
            where: { id: driver.id },
            data: {
                status: requestedStatus,
            },
        });
    }
}