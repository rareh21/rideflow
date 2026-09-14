"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export type StarRatingProps = {
    value: number;
    onChange?: (rating: number) => void;
    readOnly?: boolean;
    size?: number;
    className?: string;
};

const STAR_LABELS = [
    "1 star",
    "2 stars",
    "3 stars",
    "4 stars",
    "5 stars",
];

export function StarRating({
    value,
    onChange,
    readOnly = false,
    size = 28,
    className = "",
}: StarRatingProps) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const activeValue = hoverValue !== null ? hoverValue : value;

    return (
        <div
            className={`flex items-center gap-1.5 ${className}`}
            role="group"
            aria-label="Rating"
        >
            {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= activeValue;
                const label = STAR_LABELS[star - 1];

                if (readOnly) {
                    return (
                        <div
                            key={star}
                            className="flex items-center justify-center p-0.5 text-amber-500"
                            aria-label={label}
                        >
                            <Star
                                size={size}
                                className={isFilled ? "fill-amber-400 text-amber-500" : "fill-gray-100 text-gray-300"}
                            />
                        </div>
                    );
                }

                return (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange?.(star)}
                        onMouseEnter={() => setHoverValue(star)}
                        onMouseLeave={() => setHoverValue(null)}
                        onFocus={() => setHoverValue(star)}
                        onBlur={() => setHoverValue(null)}
                        aria-label={label}
                        aria-pressed={value === star}
                        className="
                            flex h-11 w-11 items-center justify-center rounded-xl p-1
                            text-amber-500 transition-transform hover:scale-110
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rf-green)]
                        "
                    >
                        <Star
                            size={size}
                            className={`transition-colors ${
                                isFilled
                                    ? "fill-amber-400 text-amber-500"
                                    : "fill-gray-100 text-gray-300 group-hover:text-amber-300"
                            }`}
                        />
                    </button>
                );
            })}
        </div>
    );
}
