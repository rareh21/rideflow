import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findById(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        return user;
    }

    async updateProfile(
        userId: string,
        dto: UpdateProfileDto,
    ) {
        if (
            dto.name === undefined &&
            dto.email === undefined
        ) {
            throw new BadRequestException(
                "At least one field is required",
            );
        }

        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        if (
            dto.email !== undefined &&
            dto.email.toLowerCase() !== user.email.toLowerCase()
        ) {
            const existingUser =
                await this.prisma.user.findUnique({
                    where: {
                        email: dto.email.toLowerCase(),
                    },
                });

            if (existingUser && existingUser.id !== userId) {
                throw new ConflictException(
                    "Email is already in use",
                );
            }
        }

        const updatedUser = await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                ...(dto.name !== undefined && {
                    name: dto.name.trim(),
                }),
                ...(dto.email !== undefined && {
                    email: dto.email.toLowerCase().trim(),
                }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return updatedUser;
    }

    async getPreferences(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
            },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        return this.prisma.userPreference.upsert({
            where: {
                userId,
            },
            create: {
                userId,
            },
            update: {},
        });
    }

    async updatePreferences(
        userId: string,
        dto: UpdatePreferencesDto,  
    ) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
            },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        return this.prisma.userPreference.upsert({
            where: {
                userId,
            },
            create: {
                userId,
                ...dto,
            },
            update: {
                ...dto,
            },
        });
    }
}