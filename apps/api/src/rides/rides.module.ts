import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { RidesController } from "./rides.controller";
import { RidesGateway } from "./rides.gateway";
import { RidesService } from "./rides.service";
import { RideTimeoutService } from "./ride-timeout.service";

@Module({
    imports: [AuthModule],
    controllers: [RidesController],
    providers: [RidesService, RidesGateway, RideTimeoutService],
})
export class RidesModule { }
