import { Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../../auth/auth.module";
import { RidesModule } from "../../rides/rides.module";

import { DriverLocationController } from "./driver-location.controller";
import { DriverLocationService } from "./driver-location.service";

@Module({
    imports: [PrismaModule, AuthModule, RidesModule],
    controllers: [DriverLocationController],
    providers: [DriverLocationService],
    exports: [DriverLocationService],
})
export class DriverLocationModule { }
