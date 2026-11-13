const ProgressBar = ({
    value,
    color = "var(--color-ink)",
    label,
}: {
    value: number;
    color?: string;
    label?: string;
}) => {
    const clamped = Math.max(0, Math.min(100, value));

    return (
        <div
            role="progressbar"
            aria-valuenow={Math.round(clamped)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
            className="h-1 overflow-hidden bg-rule-soft"
        >
            <div
                className="h-full transition-[width] duration-500 ease-out"
                style={{ width: `${clamped}%`, backgroundColor: color }}
            />
        </div>
    );
};

export default ProgressBar;
