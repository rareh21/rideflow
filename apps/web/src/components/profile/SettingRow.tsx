import { ReactNode } from "react";

type SettingRowProps = {
    title: string;
    description?: string;
    children: ReactNode;
};

export function SettingRow({
    title,
    description,
    children,
}: SettingRowProps) {
    return (
        <div className="flex items-center justify-between gap-5 px-4 py-4">
            <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--rf-text)]">
                    {title}
                </h3>

                {description && (
                    <p className="mt-1 text-xs leading-5 text-[var(--rf-muted)]">
                        {description}
                    </p>
                )}
            </div>

            <div className="shrink-0">
                {children}
            </div>
        </div>
    );
}