"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MessageSquare, Star } from "lucide-react";

import {
    createRideReview,
    getMyRideReview,
    type RideReview,
} from "@/lib/rides";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";

export type RideReviewSectionProps = {
    rideId: string;
    targetRole?: "DRIVER" | "RIDER";
    onSubmitted?: () => void;
};

export function RideReviewSection({
    rideId,
    targetRole = "DRIVER",
    onSubmitted,
}: RideReviewSectionProps) {
    const [review, setReview] = useState<RideReview | null>(null);
    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        async function fetchReview() {
            try {
                setLoading(true);
                const data = await getMyRideReview(rideId);
                if (isMounted) {
                    setReview(data);
                    if (data) {
                        setRating(data.rating);
                        setComment(data.comment ?? "");
                    }
                }
            } catch {
                // Silently fallback if unable to load review
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }
        void fetchReview();
        return () => {
            isMounted = false;
        };
    }, [rideId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (rating < 1 || rating > 5 || submitting) {
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            const created = await createRideReview(rideId, {
                rating,
                comment: comment.trim() || undefined,
            });
            setReview(created);
            onSubmitted?.();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to submit feedback. Please try again.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 text-center shadow-sm">
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--rf-muted)]">
                    <Loader2 size={18} className="animate-spin text-[var(--rf-green-dark)]" />
                    Loading feedback status...
                </div>
            </div>
        );
    }

    if (review) {
        return (
            <div className="rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 shadow-sm sm:p-8">
                <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                        <CheckCircle2 size={24} />
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-[var(--rf-midnight)]">
                        Thank you for your feedback!
                    </h3>

                    <p className="mt-1 text-xs text-[var(--rf-muted)]">
                        Feedback submitted
                    </p>

                    <div className="mt-4 flex flex-col items-center gap-2">
                        <StarRating value={review.rating} readOnly size={24} />
                        <span className="text-sm font-bold text-[var(--rf-midnight)]">
                            {review.rating} / 5 Stars
                        </span>
                    </div>

                    {review.comment && (
                        <div className="mt-4 w-full rounded-2xl bg-[var(--rf-surface-muted)] p-4 text-left">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--rf-muted)]">
                                <MessageSquare size={14} />
                                Your Comment
                            </div>
                            <p className="mt-1 text-sm text-[var(--rf-midnight)] italic">
                                &ldquo;{review.comment}&rdquo;
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const title =
        targetRole === "DRIVER"
            ? "How was your ride?"
            : "Rate your rider";

    const subtitle =
        targetRole === "DRIVER"
            ? "Tell us about your experience with your driver."
            : "Rate your experience with the rider for this trip.";

    return (
        <div className="rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 shadow-sm sm:p-8">
            <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                    <Star size={24} className="fill-amber-400 text-amber-500" />
                </div>

                <h3 className="mt-3 text-xl font-bold text-[var(--rf-midnight)]">
                    {title}
                </h3>

                <p className="mt-1 text-xs text-[var(--rf-muted)]">
                    {subtitle}
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700"
                >
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="flex flex-col items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-muted)]">
                        Select Rating (Required)
                    </p>
                    <StarRating
                        value={rating}
                        onChange={setRating}
                        size={32}
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--rf-muted)]">
                        <label htmlFor="review-comment">Optional feedback</label>
                        <span>{comment.length} / 500</span>
                    </div>

                    <textarea
                        id="review-comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value.slice(0, 500))}
                        placeholder="Tell us about your experience..."
                        rows={3}
                        className="
                            mt-2 w-full rounded-2xl border border-[var(--rf-border)]
                            bg-[var(--rf-surface-muted)] p-4 text-sm text-[var(--rf-midnight)]
                            placeholder:text-[var(--rf-muted)]
                            focus:border-[var(--rf-green)] focus:bg-[var(--rf-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--rf-green)]
                        "
                    />
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    disabled={rating < 1 || submitting}
                    className="w-full min-h-12 text-sm font-bold"
                >
                    {submitting ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Submitting feedback...
                        </>
                    ) : (
                        "Submit Feedback"
                    )}
                </Button>
            </form>
        </div>
    );
}
