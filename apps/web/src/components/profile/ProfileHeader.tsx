import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

type ProfileHeaderProps = {
    title: string;
    eyebrow?: string;
    backHref?: string;
    editHref?: string;
};

export function ProfileHeader({
    title,
    eyebrow = "Account",
    backHref,
    editHref,
}: ProfileHeaderProps) {
    return (
        <header className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {backHref && (
                    <Link
                        href={backHref}
                        aria-label="Go back"
                        className="
              flex h-10 w-10 items-center justify-center
              rounded-full
              border border-[var(--rf-border)]
              bg-[var(--rf-surface)]
              text-[var(--rf-midnight)]
              transition
              hover:border-[var(--rf-green)]
              hover:text-[var(--rf-green-dark)]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--rf-green)]
            "
                    >
                        <ArrowLeft size={18} />
                    </Link>
                )}

                <div>
                    <p className="text-sm font-medium text-[var(--rf-muted)]">
                        {eyebrow}
                    </p>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--rf-text)]">
                        {title}
                    </h1>
                </div>
            </div>

            {editHref && (
                <Link
                    href={editHref}
                    aria-label="Edit profile"
                    className="
            flex h-11 w-11 items-center justify-center
            rounded-full
            border border-[var(--rf-border)]
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
                    <Pencil size={18} />
                </Link>
            )}
        </header>
    );
}