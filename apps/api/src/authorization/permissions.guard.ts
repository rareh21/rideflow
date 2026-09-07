import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
    REQUIRED_PERMISSION_KEY,
} from "./require-permission.decorator";
import { Permission } from "./permissions";
import { AuthorizationService } from "./authorization.service";

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly authorizationService: AuthorizationService,
    ) { }

    canActivate(
        context: ExecutionContext,
    ): boolean {
        const permission =
            this.reflector.get<Permission>(
                REQUIRED_PERMISSION_KEY,
                context.getHandler(),
            );

        if (!permission) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user?.role) {
            throw new ForbiddenException(
                "User role is required",
            );
        }

        const allowed =
            this.authorizationService.hasPermission(
                user.role,
                permission,
            );

        if (!allowed) {
            throw new ForbiddenException(
                "You do not have permission to perform this action",
            );
        }

        return true;
    }
}