import { ReactNode } from "react";

type ProfileSectionProps = {
    title: string;
    children: ReactNode;
};

export function ProfileSection({
    title,
    children,
}: ProfileSectionProps) {
    return (
        <section className="space-y-3">
            <h2
                className="
          px-1
          text-xs font-bold
          uppercase tracking-[0.12em]
          text-[var(--rf-muted)]
        "
            >
                {title}
            </h2>

            <div
                className="
          overflow-hidden
          rounded-3xl
          border border-[var(--rf-border)]
          bg-[var(--rf-surface)]
          shadow-[0_8px_30px_rgba(7,20,31,0.05)]
        "
            >
                {children}
            </div>
        </section>
    );
}