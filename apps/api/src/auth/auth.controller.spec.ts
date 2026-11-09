import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: jest.Mocked<Partial<AuthService>>;

    beforeEach(async () => {
        authService = {
            register: jest.fn(),
            login: jest.fn(),
            getCurrentUser: jest.fn(),
            logout: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: authService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('me', () => {
        it('should call authService.getCurrentUser with current user id', async () => {
            const mockResponse = {
                user: { userId: 'u-1', name: 'Rider 1', email: 'r@test.com', role: 'RIDER' as const },
                accessToken: 'fresh-token',
                message: 'You are authenticated',
            };
            (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockResponse);

            const result = await controller.me({ userId: 'u-1', role: 'RIDER' });

            expect(authService.getCurrentUser).toHaveBeenCalledWith('u-1');
            expect(result).toEqual(mockResponse);
        });
    });
});
