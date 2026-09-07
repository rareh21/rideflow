import { Module } from "@nestjs/common";
import { AuthorizationService } from "./authorization.service";
import { PermissionsGuard } from "./permissions.guard";

@Module({
    providers: [
        AuthorizationService,
        PermissionsGuard,
    ],
    exports: [
        AuthorizationService,
        PermissionsGuard,
    ],
})
export class AuthorizationModule { }