import { Test, TestingModule } from '@nestjs/testing';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';

describe('DriversController', () => {
    let controller: DriversController;
    let driversService: jest.Mocked<Partial<DriversService>>;

    beforeEach(async () => {
        driversService = {
            create: jest.fn(),
            apply: jest.fn(),
            getApplication: jest.fn(),
            getApplications: jest.fn(),
            getApplicationById: jest.fn(),
            reviewApplication: jest.fn(),
            getMyDriver: jest.fn(),
            getMyStatus: jest.fn(),
            updateStatus: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [DriversController],
            providers: [
                {
                    provide: DriversService,
                    useValue: driversService,
                },
            ],
        }).compile();

        controller = module.get<DriversController>(DriversController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getApplicationById', () => {
        it('should correctly delegate to driversService.getApplicationById with the route id parameter', async () => {
            const appId = 'app-123';
            const mockApp = {
                id: appId,
                userId: 'user-456',
                licenseNumber: 'DL998877',
                status: 'PENDING',
            };

            (driversService.getApplicationById as jest.Mock).mockResolvedValue(mockApp as any);

            const result = await controller.getApplicationById(appId);

            expect(driversService.getApplicationById).toHaveBeenCalledWith(appId);
            expect(result).toEqual(mockApp);
        });
    });

    describe('getApplications', () => {
        it('should delegate to driversService.getApplications', async () => {
            const mockList = [
                { id: 'app-1', status: 'PENDING' },
                { id: 'app-2', status: 'APPROVED' },
            ];
            (driversService.getApplications as jest.Mock).mockResolvedValue(mockList as any);

            const result = await controller.getApplications();

            expect(driversService.getApplications).toHaveBeenCalled();
            expect(result).toEqual(mockList);
        });
    });

    describe('reviewApplication', () => {
        it('should delegate to driversService.reviewApplication with application id, admin id, and review dto', async () => {
            const appId = 'app-123';
            const adminId = 'admin-001';
            const dto = { status: 'APPROVED' as const };
            const mockResult = { id: appId, status: 'APPROVED', reviewedById: adminId };

            (driversService.reviewApplication as jest.Mock).mockResolvedValue(mockResult as any);

            const result = await controller.reviewApplication(
                appId,
                dto,
                { user: { userId: adminId } } as any,
            );

            expect(driversService.reviewApplication).toHaveBeenCalledWith(appId, adminId, dto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('apply', () => {
        it('should delegate to driversService.apply with authenticated user id and dto', async () => {
            const userId = 'user-789';
            const dto = { licenseNumber: 'DL12345' };
            const mockApp = { id: 'app-new', userId, licenseNumber: dto.licenseNumber, status: 'PENDING' };

            (driversService.apply as jest.Mock).mockResolvedValue(mockApp as any);

            const result = await controller.apply(
                { userId, role: 'RIDER' } as any,
                dto,
            );

            expect(driversService.apply).toHaveBeenCalledWith(userId, dto);
            expect(result).toEqual(mockApp);
        });
    });
});
