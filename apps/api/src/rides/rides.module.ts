import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { RidesController } from "./rides.controller";
import { RidesGateway } from "./rides.gateway";
import { RidesService } from "./rides.service";

@Module({
    imports: [AuthModule],
    controllers: [RidesController],
    providers: [RidesService, RidesGateway],
})
export class RidesModule { }
