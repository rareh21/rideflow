import { Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import {
    Permission,
} from "./permissions";
import { ROLE_PERMISSIONS } from "./role-permissions";

@Injectable()
export class AuthorizationService {
    hasPermission(
        role: UserRole,
        permission: Permission,
    ): boolean {
        return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
    }

    hasAnyPermission(
        role: UserRole,
        permissions: Permission[],
    ): boolean {
        return permissions.some((permission) =>
            this.hasPermission(role, permission),
        );
    }

    hasAllPermissions(
        role: UserRole,
        permissions: Permission[],
    ): boolean {
        return permissions.every((permission) =>
            this.hasPermission(role, permission),
        );
    }

    getPermissions(role: UserRole): Permission[] {
        return ROLE_PERMISSIONS[role] ?? [];
    }
}