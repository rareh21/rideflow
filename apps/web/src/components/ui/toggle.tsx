"use client";

type ToggleProps = {
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
    label: string;
};

export function Toggle({
    checked,
    onChange,
    disabled = false,
    label,
}: ToggleProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`
        relative h-7 w-12
        rounded-full
        transition-colors
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[var(--rf-green)]

        ${checked
                    ? "bg-[var(--rf-green)]"
                    : "bg-[var(--rf-border)]"
                }

        disabled:cursor-not-allowed
        disabled:opacity-50
      `}
        >
            <span
                className={`
          absolute top-1
          h-5 w-5
          rounded-full
          bg-white
          shadow
          transition-transform
          ${checked ? "translate-x-6" : "translate-x-1"}
        `}
            />
        </button>
    );
}