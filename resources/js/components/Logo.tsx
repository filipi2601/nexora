export default function Logo({ size = "md" }: { size?: "md" | "lg" }) {
    const large = size === "lg";

    return (
        <span className="flex items-center gap-2.5">
            <span
                aria-hidden="true"
                className={`flex items-end gap-[2px] ${large ? "h-[26px]" : "h-[22px]"}`}
            >
                {(["h-full bg-subject-1", "h-[86%] bg-subject-2", "h-full bg-subject-3", "h-[72%] bg-subject-4"] as const).map(
                    (spine) => (
                        <i
                            key={spine}
                            className={`block rounded-[1px] ${large ? "w-[6px]" : "w-[5px]"} ${spine}`}
                        />
                    ),
                )}
            </span>
            <span
                className={`font-display leading-none font-bold tracking-[0.01em] text-ink ${large ? "text-[28px]" : "text-[23px]"}`}
            >
                Nexora
            </span>
        </span>
    );
}
