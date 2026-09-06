import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";
import { UpdateSavedPlaceDto } from "./dto/update-saved-place.dto";
import { CreateSavedPlaceDto } from "./dto/create-saved-place.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import * as bcrypt from "bcrypt";

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

    async getSavedPlaces(userId: string) {
        return this.prisma.savedPlace.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });
    }

    async createSavedPlace(
        userId: string,
        dto: CreateSavedPlaceDto,
    ) {
        return this.prisma.savedPlace.create({
            data: {
                userId,
                label: dto.label.trim(),
                address: dto.address.trim(),
                latitude: dto.latitude,
                longitude: dto.longitude,
            },
        });
    }

    async updateSavedPlace(
        userId: string,
        placeId: string,
        dto: UpdateSavedPlaceDto,
    ) {
        const place = await this.prisma.savedPlace.findFirst({
            where: {
                id: placeId,
                userId,
            },
        });

        if (!place) {
            throw new NotFoundException("Saved place not found");
        }

        return this.prisma.savedPlace.update({
            where: {
                id: placeId,
            },
            data: {
                ...(dto.label !== undefined && {
                    label: dto.label.trim(),
                }),
                ...(dto.address !== undefined && {
                    address: dto.address.trim(),
                }),
                ...(dto.latitude !== undefined && {
                    latitude: dto.latitude,
                }),
                ...(dto.longitude !== undefined && {
                    longitude: dto.longitude,
                }),
            },
        });
    }

    async deleteSavedPlace(
        userId: string,
        placeId: string,
    ) {
        const place = await this.prisma.savedPlace.findFirst({
            where: {
                id: placeId,
                userId,
            },
        });

        if (!place) {
            throw new NotFoundException("Saved place not found");
        }

        await this.prisma.savedPlace.delete({
            where: {
                id: placeId,
            },
        });

        return {
            success: true,
        };
    }

    async changePassword(
        userId: string,
        dto: ChangePasswordDto,
    ) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        const passwordMatches = await bcrypt.compare(
            dto.currentPassword,
            user.passwordHash,
        );

        if (!passwordMatches) {
            throw new UnauthorizedException(
                "Current password is incorrect",
            );
        }

        const samePassword = await bcrypt.compare(
            dto.newPassword,
            user.passwordHash,
        );

        if (samePassword) {
            throw new BadRequestException(
                "New password must be different from the current password",
            );
        }

        const passwordHash = await bcrypt.hash(
            dto.newPassword,
            12,
        );

        await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                passwordHash,
            },
        });

        // Invalidate existing refresh tokens.
        await this.prisma.refreshToken.deleteMany({
            where: {
                userId,
            },
        });

        return {
            success: true,
        };
    }
}