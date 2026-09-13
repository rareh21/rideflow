import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { RidesController } from "./rides.controller";
import { RidesGateway } from "./rides.gateway";
import { RidesService } from "./rides.service";
import { RideTimeoutService } from "./ride-timeout.service";
import { RoutingService } from "./routing/routing.service";
import { GoogleRoutesProvider } from "./routing/google-routes.provider";

@Module({
    imports: [AuthModule],
    controllers: [RidesController],
    providers: [
        RidesService,
        RidesGateway,
        RideTimeoutService,
        RoutingService,
        GoogleRoutesProvider,
    ],
})
export class RidesModule { }
