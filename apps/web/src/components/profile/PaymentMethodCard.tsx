import {
    Check,
    CreditCard,
    IndianRupee,
    Smartphone,
} from "lucide-react";

type PaymentMethod = "UPI" | "CARD" | "CASH";

type PaymentMethodCardProps = {
    method: PaymentMethod;
    selected: boolean;
    onSelect: () => void;
};

const methods = {
    UPI: {
        title: "UPI",
        description: "Pay instantly using your UPI app",
        icon: Smartphone,
    },
    CARD: {
        title: "Card",
        description: "Use your debit or credit card",
        icon: CreditCard,
    },
    CASH: {
        title: "Cash",
        description: "Pay the driver in cash",
        icon: IndianRupee,
    },
};

export function PaymentMethodCard({
    method,
    selected,
    onSelect,
}: PaymentMethodCardProps) {
    const config = methods[method];
    const Icon = config.icon;

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={`
        flex w-full items-center gap-4
        rounded-2xl
        border p-4
        text-left
        transition
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[var(--rf-green)]

        ${selected
                    ? "border-[var(--rf-green)] bg-[var(--rf-surface-muted)]"
                    : "border-[var(--rf-border)] bg-[var(--rf-surface)] hover:bg-[var(--rf-surface-muted)]"
                }
      `}
        >
            <span
                className="
          flex h-11 w-11 shrink-0
          items-center justify-center
          rounded-xl
          bg-[var(--rf-surface-muted)]
          text-[var(--rf-midnight)]
        "
            >
                <Icon size={20} />
            </span>

            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[var(--rf-text)]">
                    {config.title}
                </span>

                <span className="mt-1 block text-xs text-[var(--rf-muted)]">
                    {config.description}
                </span>
            </span>

            <span
                className={`
          flex h-6 w-6 shrink-0
          items-center justify-center
          rounded-full border

          ${selected
                        ? "border-[var(--rf-green)] bg-[var(--rf-green)] text-[var(--rf-midnight)]"
                        : "border-[var(--rf-border)]"
                    }
        `}
            >
                {selected && <Check size={14} strokeWidth={3} />}
            </span>
        </button>
    );
}