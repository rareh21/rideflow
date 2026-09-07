import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt/dist/jwt.service";
import { UserRole } from "@prisma/client/edge";

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService
    ) { }

    async register(dto: RegisterDto) {
        const email = dto.email.trim().toLowerCase();
        const existingUser = await this.prisma.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: "insensitive",
                },
            },
        });

        if (existingUser) {
            throw new ConflictException("Email already registered");
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);

        const user = await this.prisma.user.create({
            data: {
                name: dto.name.trim(),
                email: email,
                passwordHash,
                role: UserRole.RIDER,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        return user;
    }

    async login(dto: LoginDto) {
        const email = dto.email.trim().toLowerCase();
        const user =
            await this.prisma.user.findFirst({
                where: {
                    email: {
                        equals: email,
                        mode: "insensitive",
                    },
                },
            });

        if (!user) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const passwordValid = await bcrypt.compare(
            dto.password,
            user.passwordHash,
        );

        if (!passwordValid) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            role: user.role,
        });

        return {
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }

    async logout(userId: string) {
        await this.prisma.refreshToken.deleteMany({
            where: { userId },
        });

        return {
            success: true,
            message: 'Logged out successfully',
        };
    }
}
