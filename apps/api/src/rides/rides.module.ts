import { Module, forwardRef } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { PaymentModule } from "../payment/payment.module";
import { RidesController } from "./rides.controller";
import { RidesGateway } from "./rides.gateway";
import { RidesService } from "./rides.service";
import { RideTimeoutService } from "./ride-timeout.service";
import { RoutingService } from "./routing/routing.service";
import { GoogleRoutesProvider } from "./routing/google-routes.provider";

@Module({
    imports: [
        AuthModule,
        forwardRef(() => PaymentModule),
    ],
    controllers: [RidesController],
    providers: [
        RidesService,
        RidesGateway,
        RideTimeoutService,
        RoutingService,
        GoogleRoutesProvider,
    ],
    exports: [RidesGateway, RidesService],
})
export class RidesModule { }
