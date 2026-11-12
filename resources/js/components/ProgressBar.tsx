const ProgressBar = ({
    value,
    color = "bg-indigo-600",
}: {
    value: number;
    color?: string;
}) => {
    return (
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${value}%` }}
            />
        </div>
    );
};

export default ProgressBar;
