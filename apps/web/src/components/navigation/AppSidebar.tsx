"use client";

import Link from "next/link";

import type { NavigationItem } from "@/config/navigation";

interface AppSidebarProps {
    items: NavigationItem[];
    pathname: string;
}

export function AppSidebar({
    items,
    pathname,
}: AppSidebarProps) {
    return (
        <aside
            className="
                hidden
                w-64
                shrink-0
                border-r
                border-[var(--rf-border)]
                bg-[var(--rf-surface)]
                lg:block
            "
        >
            <nav
                className="
                    sticky
                    top-16
                    p-4
                "
            >
                <div className="mb-4 px-3">
                    <p
                        className="
                            text-xs
                            font-semibold
                            uppercase
                            tracking-wider
                            text-[var(--rf-muted)]
                        "
                    >
                        Navigation
                    </p>
                </div>

                <div className="space-y-1">
                    {items.map((item) => {
                        const Icon = item.icon;

                        const active =
                            pathname === item.href ||
                            pathname.startsWith(
                                `${item.href}/`
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
                                    items-center
                                    gap-3
                                    rounded-xl
                                    px-3
                                    py-3
                                    text-sm
                                    font-medium
                                    transition

                                    ${
                                        active
                                            ? `
                                                bg-[var(--rf-green)]/10
                                                text-[var(--rf-midnight)]
                                            `
                                            : `
                                                text-[var(--rf-muted)]
                                                hover:bg-[var(--rf-surface-muted)]
                                                hover:text-[var(--rf-midnight)]
                                            `
                                    }

                                    focus-visible:outline-none
                                    focus-visible:ring-2
                                    focus-visible:ring-[var(--rf-green)]
                                `}
                            >
                                <Icon size={19} />

                                <span>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </aside>
    );
}