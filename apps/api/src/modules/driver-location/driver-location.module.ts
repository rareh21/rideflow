import { Module } from "@nestjs/common";

import { AuthModule } from "../../auth/auth.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { RidesModule } from "../../rides/rides.module";
import {
    DriverLocationController,
    RideDriverLocationController,
} from "./driver-location.controller";
import { DriverLocationService } from "./driver-location.service";

@Module({
    imports: [PrismaModule, AuthModule, RidesModule],
    controllers: [
        DriverLocationController,
        RideDriverLocationController,
    ],
    providers: [DriverLocationService],
    exports: [DriverLocationService],
})
export class DriverLocationModule { }
