import { PaymentStatus } from "@prisma/client";

/**
 * Validates whether a transition from current PaymentStatus to target PaymentStatus is allowed.
 *
 * Transitions:
 * - PENDING    → PROCESSING, SUCCEEDED, FAILED, CANCELLED
 * - PROCESSING → SUCCEEDED, FAILED
 * - FAILED     → PROCESSING, PENDING, SUCCEEDED (for retries)
 * - SUCCEEDED  → None (terminal)
 * - CANCELLED  → None (terminal)
 */
export function isValidPaymentTransition(
    current: PaymentStatus,
    target: PaymentStatus,
): boolean {
    if (current === target) {
        return true;
    }

    switch (current) {
        case PaymentStatus.PENDING:
            return (
                target === PaymentStatus.PROCESSING ||
                target === PaymentStatus.SUCCEEDED ||
                target === PaymentStatus.FAILED ||
                target === PaymentStatus.CANCELLED
            );

        case PaymentStatus.PROCESSING:
            return (
                target === PaymentStatus.SUCCEEDED ||
                target === PaymentStatus.FAILED
            );

        case PaymentStatus.FAILED:
            return (
                target === PaymentStatus.PROCESSING ||
                target === PaymentStatus.PENDING ||
                target === PaymentStatus.SUCCEEDED
            );

        case PaymentStatus.SUCCEEDED:
        case PaymentStatus.CANCELLED:
            return false;

        default:
            return false;
    }
}
