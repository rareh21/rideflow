import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
    let service: AuthService;
    let prisma: {
        user: any;
        refreshToken: any;
    };
    let jwtService: {
        signAsync: jest.Mock;
    };

    beforeEach(async () => {
        prisma = {
            user: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
            },
            refreshToken: {
                deleteMany: jest.fn(),
            },
        };

        jwtService = {
            signAsync: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
                {
                    provide: JwtService,
                    useValue: jwtService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getCurrentUser', () => {
        it('should return user details and fresh access token for valid user', async () => {
            const mockUser = {
                id: 'u-123',
                name: 'Alex Rivera',
                email: 'alex@example.com',
                role: 'DRIVER',
            };
            prisma.user.findUnique.mockResolvedValue(mockUser);
            jwtService.signAsync.mockResolvedValue('new-jwt-token');

            const result = await service.getCurrentUser('u-123');

            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'u-123' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            });
            expect(jwtService.signAsync).toHaveBeenCalledWith({
                sub: 'u-123',
                role: 'DRIVER',
            });
            expect(result).toEqual({
                user: {
                    userId: 'u-123',
                    name: 'Alex Rivera',
                    email: 'alex@example.com',
                    role: 'DRIVER',
                },
                accessToken: 'new-jwt-token',
                message: 'You are authenticated',
            });
        });

        it('should throw UnauthorizedException if user not found in database', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.getCurrentUser('missing-user')).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });
});
