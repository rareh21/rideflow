"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { getRoleHome } from "@/lib/navigation";

export function AppHeader() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <header
            className="
                sticky
                top-0
                z-40
                h-16
                border-b
                border-[var(--rf-border)]
                bg-[var(--rf-surface)]/95
                backdrop-blur
            "
        >
            <div
                className="
                    flex
                    h-full
                    items-center
                    justify-between
                    px-4
                    sm:px-6
                    lg:px-8
                "
            >
                {/* Brand */}
                <Link
                    href={getRoleHome(user.role)}
                    className="
                        text-xl
                        font-bold
                        tracking-tight
                        text-[var(--rf-midnight)]
                    "
                >
                    Ride
                    <span className="text-[var(--rf-green)]">
                        Flow
                    </span>
                </Link>

                {/* Profile */}
                <Link
                    href="/profile"
                    aria-label="Open profile"
                    className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-[var(--rf-border)]
                        bg-[var(--rf-surface)]
                        text-[var(--rf-midnight)]
                        shadow-sm
                        transition
                        hover:border-[var(--rf-green)]
                        hover:text-[var(--rf-green-dark)]
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-[var(--rf-green)]
                    "
                >
                    <UserRound size={19} />
                </Link>
            </div>
        </header>
    );
}