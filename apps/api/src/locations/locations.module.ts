import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { LocationsController } from "./locations.controller";
import { LocationsService } from "./locations.service";
import { GooglePlacesProvider } from "./google-places.provider";

@Module({
    imports: [AuthModule],
    controllers: [LocationsController],
    providers: [LocationsService, GooglePlacesProvider],
})
export class LocationsModule {}
