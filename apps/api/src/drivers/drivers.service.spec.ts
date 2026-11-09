import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { PrismaService } from '../prisma/prisma.service';
import { DriverStatus, UserRole } from '@prisma/client';

describe('DriversService', () => {
    let service: DriversService;
    let prisma: {
        user: any;
        driver: any;
        driverApplication: any;
        $transaction: any;
    };

    beforeEach(async () => {
        prisma = {
            user: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            driver: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            driverApplication: {
                findUnique: jest.fn(),
                findMany: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DriversService,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
            ],
        }).compile();

        service = module.get<DriversService>(DriversService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('apply', () => {
        it('should throw NotFoundException if user is not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(
                service.apply('missing-user', { licenseNumber: 'DL123' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException if user is already a driver', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                role: UserRole.DRIVER,
                driver: { id: 'driver-1' },
                driverApplication: null,
            });

            await expect(
                service.apply('user-1', { licenseNumber: 'DL123' }),
            ).rejects.toThrow(ConflictException);
        });

        it('should throw ConflictException if user already has a pending application', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                role: UserRole.RIDER,
                driver: null,
                driverApplication: { id: 'app-1', status: 'PENDING' },
            });

            await expect(
                service.apply('user-1', { licenseNumber: 'DL123' }),
            ).rejects.toThrow(ConflictException);
        });

        it('should allow re-applying by updating previous rejected application', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                role: UserRole.RIDER,
                driver: null,
                driverApplication: { id: 'app-1', status: 'REJECTED' },
            });

            const updatedApp = {
                id: 'app-1',
                status: 'PENDING',
                licenseNumber: 'NEW_DL_99',
            };
            prisma.driverApplication.update.mockResolvedValue(updatedApp);

            const result = await service.apply('user-1', { licenseNumber: 'NEW_DL_99' });

            expect(prisma.driverApplication.update).toHaveBeenCalledWith({
                where: { id: 'app-1' },
                data: expect.objectContaining({
                    status: 'PENDING',
                    licenseNumber: 'NEW_DL_99',
                    rejectionReason: null,
                }),
            });
            expect(result).toEqual(updatedApp);
        });

        it('should create new application for rider with no previous application', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-2',
                role: UserRole.RIDER,
                driver: null,
                driverApplication: null,
            });

            const created = { id: 'app-new', userId: 'user-2', status: 'PENDING' };
            prisma.driverApplication.create.mockResolvedValue(created);

            const result = await service.apply('user-2', { licenseNumber: 'DL_NEW_1' });

            expect(prisma.driverApplication.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-2',
                    licenseNumber: 'DL_NEW_1',
                },
            });
            expect(result).toEqual(created);
        });
    });

    describe('getApplicationById', () => {
        it('should find application by its primary key id', async () => {
            const mockApp = { id: 'app-100', userId: 'u-100', status: 'PENDING' };
            prisma.driverApplication.findUnique.mockResolvedValue(mockApp);

            const result = await service.getApplicationById('app-100');

            expect(prisma.driverApplication.findUnique).toHaveBeenCalledWith({
                where: { id: 'app-100' },
                include: expect.any(Object),
            });
            expect(result).toEqual(mockApp);
        });

        it('should throw NotFoundException if application id does not exist', async () => {
            prisma.driverApplication.findUnique.mockResolvedValue(null);

            await expect(service.getApplicationById('missing-app')).rejects.toThrow(NotFoundException);
        });
    });

    describe('reviewApplication', () => {
        it('should throw NotFoundException if application does not exist', async () => {
            prisma.driverApplication.findUnique.mockResolvedValue(null);

            await expect(
                service.reviewApplication('app-x', 'admin-1', { status: 'APPROVED' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if application is not in PENDING status', async () => {
            prisma.driverApplication.findUnique.mockResolvedValue({
                id: 'app-x',
                status: 'APPROVED',
            });

            await expect(
                service.reviewApplication('app-x', 'admin-1', { status: 'APPROVED' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if status is REJECTED but no rejectionReason is provided', async () => {
            prisma.driverApplication.findUnique.mockResolvedValue({
                id: 'app-x',
                status: 'PENDING',
            });

            await expect(
                service.reviewApplication('app-x', 'admin-1', { status: 'REJECTED', rejectionReason: '   ' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should approve application: create Driver, promote User to DRIVER, and mark application APPROVED in a transaction', async () => {
            const application = {
                id: 'app-200',
                userId: 'user-200',
                licenseNumber: 'DL-VERIFIED-123',
                status: 'PENDING',
            };
            prisma.driverApplication.findUnique.mockResolvedValue(application);

            const mockDriver = { id: 'driver-200', userId: 'user-200', status: DriverStatus.OFFLINE };
            prisma.driver.create.mockResolvedValue(mockDriver);
            prisma.user.update.mockResolvedValue({ id: 'user-200', role: UserRole.DRIVER });
            prisma.driverApplication.update.mockResolvedValue({
                id: 'app-200',
                status: 'APPROVED',
                reviewedById: 'admin-1',
            });

            const result = await service.reviewApplication('app-200', 'admin-1', { status: 'APPROVED' });

            expect(prisma.$transaction).toHaveBeenCalled();
            expect(prisma.driver.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-200',
                    licenseNumber: 'DL-VERIFIED-123',
                    status: 'OFFLINE',
                },
            });
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-200' },
                data: { role: UserRole.DRIVER },
            });
            expect(result.status).toEqual('APPROVED');
        });

        it('should reject application: update status to REJECTED and store trimmed rejection reason', async () => {
            const application = {
                id: 'app-300',
                userId: 'user-300',
                status: 'PENDING',
            };
            prisma.driverApplication.findUnique.mockResolvedValue(application);

            prisma.driverApplication.update.mockResolvedValue({
                id: 'app-300',
                status: 'REJECTED',
                rejectionReason: 'Licence image is blurred',
                reviewedById: 'admin-1',
            });

            const result = await service.reviewApplication('app-300', 'admin-1', {
                status: 'REJECTED',
                rejectionReason: '  Licence image is blurred  ',
            });

            expect(prisma.driverApplication.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'app-300' },
                    data: expect.objectContaining({
                        status: 'REJECTED',
                        rejectionReason: 'Licence image is blurred',
                    }),
                }),
            );
            expect(result.status).toEqual('REJECTED');
        });
    });

    describe('updateStatus', () => {
        it('should allow valid driver transitions (e.g. OFFLINE -> AVAILABLE)', async () => {
            prisma.driver.findUnique.mockResolvedValue({
                id: 'd-1',
                userId: 'u-1',
                status: DriverStatus.OFFLINE,
            });

            prisma.driver.update.mockResolvedValue({
                id: 'd-1',
                status: DriverStatus.AVAILABLE,
                updatedAt: new Date(),
            });

            const result = await service.updateStatus('u-1', DriverStatus.AVAILABLE);
            expect(result.status).toBe(DriverStatus.AVAILABLE);
        });

        it('should reject invalid driver status transitions (e.g. OFFLINE -> BUSY)', async () => {
            prisma.driver.findUnique.mockResolvedValue({
                id: 'd-1',
                userId: 'u-1',
                status: DriverStatus.OFFLINE,
            });

            await expect(
                service.updateStatus('u-1', DriverStatus.BUSY),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
