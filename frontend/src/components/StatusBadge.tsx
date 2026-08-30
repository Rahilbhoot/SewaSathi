export function StatusBadge({ status }: { status?: string | undefined }) {
  const s = (status ?? "pending").toLowerCase();
  const tone =
    s === "completed"
      ? "bg-success-soft text-success"
      : s === "cancelled"
        ? "bg-muted text-muted-foreground"
        : s === "assigned" || s === "in-progress" || s === "in_progress"
          ? "bg-primary-soft text-primary"
          : "bg-warning-soft text-warning";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}
    >
      {s.replace(/[_-]/g, " ")}
    </span>
  );
}
