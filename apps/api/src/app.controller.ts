import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("health")
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      database: "connected",
      service: "rideflow-api",
    };
  }

  @Get("users/count")
  async getUserCount() {
    const count = await this.prisma.user.count();

    return {
      count,
    };
  }
}