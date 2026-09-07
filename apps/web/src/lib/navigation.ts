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

export function isNavigationItemActive(
    pathname: string,
    href: string,
) {
    // Exact match always wins.
    if (pathname === href) {
        return true;
    }

    // Root role pages such as /driver, /rider and /admin
    // should NOT match their child routes.
    if (
        href === "/driver" ||
        href === "/rider" ||
        href === "/admin"
    ) {
        return false;
    }

    return pathname.startsWith(`${href}/`);
}