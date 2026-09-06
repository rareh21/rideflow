type ProfileCardProps = {
    name: string;
    email: string;
    role: string;
    createdAt?: string;
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

                    <span
                        className="
              mt-3 inline-flex
              rounded-full
              bg-white/10
              px-3 py-1
              text-xs font-semibold
              text-[var(--rf-green)]
            "
                    >
                        {role}
                    </span>
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