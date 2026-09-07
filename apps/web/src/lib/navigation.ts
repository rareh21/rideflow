import type { AuthenticatedUser } from "@/context/auth-context";

export function getRoleHome(
    role: AuthenticatedUser["role"]
) {
    switch (role) {
        case "DRIVER":
            return "/driver";

        case "ADMIN":
            return "/admin";

        case "RIDER":
        default:
            return "/rider";
    }
}