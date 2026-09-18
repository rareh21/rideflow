import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { PrismaService } from "./prisma/prisma.service";

describe("AppController", () => {
  let appController: AppController;
  let prismaStub: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prismaStub = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: PrismaService, useValue: prismaStub },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("health", () => {
    it('should return status ok', async () => {
      const result = await appController.health();
      expect(result).toEqual({
        status: "ok",
        database: "connected",
        service: "rideflow-api",
      });
    });
  });
});
