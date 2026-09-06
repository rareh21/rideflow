import { AlertCircle, RefreshCw } from "lucide-react";

type ProfileErrorProps = {
    message: string;
    onRetry?: () => void;
};

export function ProfileError({
    message,
    onRetry,
}: ProfileErrorProps) {
    return (
        <div
            role="alert"
            className="
        rounded-3xl
        border border-red-200
        bg-[var(--rf-surface)]
        p-6
        shadow-[0_8px_30px_rgba(7,20,31,0.05)]
      "
        >
            <div className="flex items-start gap-4">
                <div
                    className="
            flex h-11 w-11 shrink-0
            items-center justify-center
            rounded-xl
            bg-red-50
            text-[var(--rf-danger)]
          "
                >
                    <AlertCircle size={21} />
                </div>

                <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-[var(--rf-text)]">
                        Unable to load your profile
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-[var(--rf-muted)]">
                        {message}
                    </p>

                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="
                mt-4 inline-flex
                items-center gap-2
                rounded-xl
                bg-[var(--rf-midnight)]
                px-4 py-2.5
                text-sm font-semibold
                text-white
                transition
                hover:bg-[var(--rf-midnight)]/90
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[var(--rf-green)]
              "
                        >
                            <RefreshCw size={16} />
                            Try again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}