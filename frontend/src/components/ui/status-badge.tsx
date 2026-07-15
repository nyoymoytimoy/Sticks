import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "error";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-surface-secondary text-ink-500 border-border",
  info: "bg-surface-stat text-teal border-teal/30",
  success: "bg-surface-stat text-status-success border-status-success/30",
  warning: "bg-surface-secondary text-status-warning border-status-warning/30",
  error: "bg-surface-secondary text-status-error border-status-error/30",
};

/**
 * Maps every cross-ticket-type status code (see ticket_statuses in the
 * schema) to a visual tone. Statuses not yet listed fall back to "neutral"
 * rather than throwing, since new ticket-type-specific statuses may be added
 * without touching this component.
 */
const statusToneMap: Record<string, StatusTone> = {
  new: "neutral",
  pending_approval: "info",
  approved: "info",
  assigned: "info",
  in_progress: "info",
  for_discussion: "warning",
  acknowledged: "info",
  resolved: "success",
  done: "success",
  closed: "success",
  reopened: "warning",
  sent_back: "warning",
  declined: "error",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const tone = statusToneMap[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-3 py-1 text-xs font-bold uppercase tracking-wide",
        toneClasses[tone],
        className
      )}
    >
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}
