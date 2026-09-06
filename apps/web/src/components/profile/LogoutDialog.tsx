"use client";

import { LogOut, X } from "lucide-react";
import { useEffect } from "react";

type LogoutDialogProps = {
    open: boolean;
    loading?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

export function LogoutDialog({
    open,
    loading = false,
    onCancel,
    onConfirm,
}: LogoutDialogProps) {
    useEffect(() => {
        if (!open) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !loading) {
                onCancel();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, loading, onCancel]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="
        fixed inset-0 z-50
        flex items-end justify-center
        bg-[var(--rf-midnight)]/55
        p-4
        sm:items-center
      "
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-description"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !loading) {
                    onCancel();
                }
            }}
        >
            <div
                className="
          w-full max-w-md
          rounded-[2rem]
          border border-[var(--rf-border)]
          bg-[var(--rf-surface)]
          p-6
          shadow-2xl
        "
                onMouseDown={(event) => event.stopPropagation()}
            >
                {/* Icon / Close */}
                <div className="flex items-start justify-between">
                    <div
                        className="
              flex h-12 w-12
              items-center justify-center
              rounded-2xl
              bg-red-50
              text-[var(--rf-danger)]
            "
                    >
                        <LogOut size={22} />
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        aria-label="Close logout confirmation"
                        className="
              flex h-9 w-9
              items-center justify-center
              rounded-full
              text-[var(--rf-muted)]
              transition
              hover:bg-[var(--rf-surface-muted)]
              hover:text-[var(--rf-text)]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--rf-green)]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="mt-5">
                    <h2
                        id="logout-dialog-title"
                        className="
                        text-xl font-bold
                        text-[var(--rf-text)]
                        "
                    >
                        Sign out of RideFlow?
                    </h2>

                    <p
                        id="logout-dialog-description"
                        className="
                        mt-2
                        text-sm leading-6
                        text-[var(--rf-muted)]
                        "
                    >
                        You can sign back in anytime using your RideFlow account.
                    </p>
                </div>

                {/* Actions */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="
                        rounded-2xl
                        border border-[var(--rf-border)]
                        bg-[var(--rf-surface)]
                        px-4 py-3
                        text-sm font-semibold
                        text-[var(--rf-text)]
                        transition
                        hover:bg-[var(--rf-surface-muted)]
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-[var(--rf-green)]
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        "
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="
                        rounded-2xl
                        bg-[var(--rf-danger)]
                        px-4 py-3
                        text-sm font-semibold
                        text-white
                        transition
                        hover:bg-red-600
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-red-500
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        "
                    >
                        {loading ? "Signing out..." : "Sign out"}
                    </button>
                </div>
            </div>
        </div>
    );
}