"use client";

import Link from "next/link";

import type { NavigationItem } from "@/config/navigation";
import { isNavigationItemActive } from "@/lib/navigation";

interface MobileBottomNavProps {
    items: NavigationItem[];
    pathname: string;
}

export function MobileBottomNav({
    items,
    pathname,
}: MobileBottomNavProps) {
    /*
     * Keep mobile navigation compact.
     * The role-specific navigation configuration
     * remains the source of truth.
     */
    const visibleItems = items.filter(
        (item) => item.mobile !== false
    );

    return (
        <nav
            className="
                fixed
                inset-x-0
                bottom-0
                z-50
                border-t
                border-[var(--rf-border)]
                bg-[var(--rf-surface)]/95
                backdrop-blur
                lg:hidden
            "
        >
            <div
                className="
                    mx-auto
                    flex
                    max-w-lg
                    items-center
                    justify-around
                    px-2
                    py-2
                "
            >
                {visibleItems.map((item) => {
                    const Icon = item.icon;

                    const active = isNavigationItemActive(
                        pathname,
                        item.href,
                    );

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={
                                active
                                    ? "page"
                                    : undefined
                            }
                            className={`
                                flex
                                min-w-16
                                flex-col
                                items-center
                                gap-1
                                rounded-xl
                                px-2
                                py-2
                                text-[11px]
                                font-medium
                                transition

                                ${active
                                    ? `
                                            text-[var(--rf-green-dark)]
                                        `
                                    : `
                                            text-[var(--rf-muted)]
                                        `
                                }

                                focus-visible:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-[var(--rf-green)]
                            `}
                        >
                            <Icon size={20} />

                            <span>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}