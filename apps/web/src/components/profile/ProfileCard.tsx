import { Star } from "lucide-react";
import type { UserRatingSummary } from "@/lib/rides";

type ProfileCardProps = {
    name: string;
    email: string;
    role: string;
    createdAt?: string;
    ratingSummary?: UserRatingSummary | null;
};

function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

function formatMemberSince(date?: string) {
    if (!date) return null;

    return new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
    }).format(new Date(date));
}

export function ProfileCard({
    name,
    email,
    role,
    createdAt,
    ratingSummary,
}: ProfileCardProps) {
    return (
        <section
            className="
        relative overflow-hidden
        rounded-[2rem]
        bg-[var(--rf-midnight)]
        p-6
        text-white
        shadow-[0_16px_40px_rgba(7,20,31,0.15)]
      "
        >
            <div
                className="
          absolute -right-16 -top-20
          h-44 w-44
          rounded-full
          bg-[var(--rf-green)]/15
        "
            />

            <div
                className="
          absolute -bottom-20 -left-16
          h-40 w-40
          rounded-full
          bg-[var(--rf-green)]/10
        "
            />

            <div className="relative flex items-center gap-4">
                <div
                    className="
            flex h-20 w-20 shrink-0
            items-center justify-center
            rounded-2xl
            bg-[var(--rf-green)]
            text-2xl font-bold
            text-[var(--rf-midnight)]
          "
                >
                    {getInitials(name)}
                </div>

                <div className="min-w-0">
                    <h2 className="truncate text-xl font-bold">
                        {name}
                    </h2>

                    <p className="mt-1 truncate text-sm text-white/65">
                        {email}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                            className="
                  inline-flex
                  rounded-full
                  bg-white/10
                  px-3 py-1
                  text-xs font-semibold
                  text-[var(--rf-green)]
                "
                        >
                            {role}
                        </span>

                        {ratingSummary !== undefined && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300">
                                <Star size={13} className="fill-amber-400 text-amber-400" />
                                {ratingSummary?.averageRating
                                    ? `${ratingSummary.averageRating} (${ratingSummary.totalRatings} rating${ratingSummary.totalRatings === 1 ? "" : "s"})`
                                    : "No ratings yet"}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {createdAt && (
                <p className="relative mt-6 text-xs text-white/55">
                    Member since {formatMemberSince(createdAt)}
                </p>
            )}
        </section>
    );
}