import Link from "next/link";
import { ChevronRight, LucideIcon } from "lucide-react";

type ProfileMenuItemProps = {
    href: string;
    icon: LucideIcon;
    title: string;
    description?: string;
};

export function ProfileMenuItem({
    href,
    icon: Icon,
    title,
    description,
}: ProfileMenuItemProps) {
    return (
        <Link
            href={href}
            className="
        group flex min-h-[76px] items-center gap-4
        px-4 py-3
        transition-colors
        hover:bg-[var(--rf-surface-muted)]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-inset
        focus-visible:ring-[var(--rf-green)]
      "
        >
            <span
                className="
          flex h-11 w-11 shrink-0
          items-center justify-center
          rounded-xl
          bg-[var(--rf-surface-muted)]
          text-[var(--rf-green-dark)]
        "
            >
                <Icon size={20} strokeWidth={2} />
            </span>

            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[var(--rf-text)]">
                    {title}
                </span>

                {description && (
                    <span className="mt-1 block text-xs text-[var(--rf-muted)]">
                        {description}
                    </span>
                )}
            </span>

            <ChevronRight
                size={18}
                className="
          shrink-0
          text-[var(--rf-muted)]
          transition-transform
          group-hover:translate-x-0.5
        "
            />
        </Link>
    );
}