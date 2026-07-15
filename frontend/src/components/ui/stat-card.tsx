import {
  TrendingUp,
  Users,
  RefreshCw,
  AlertTriangle,
  CircleX,
  Ticket,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icons are referenced by name (a serializable string), not passed as
// component references -- this component gets used from Server Component
// pages (the dashboard, spec 016), and a function/component reference can't
// cross that boundary (see the sidebar and DataTable fixes in specs 004/005
// for the same issue).
const ICONS = {
  trend: TrendingUp,
  users: Users,
  refresh: RefreshCw,
  warning: AlertTriangle,
  error: CircleX,
  ticket: Ticket,
  clock: Clock,
  check: CheckCircle2,
} as const;

export type StatIconName = keyof typeof ICONS;

const chipToneClasses = {
  gold: "bg-gold/15 text-gold-dark",
  teal: "bg-teal/15 text-teal",
  success: "bg-status-success/15 text-status-success",
  warning: "bg-status-warning/15 text-status-warning",
  error: "bg-status-error/15 text-status-error",
} as const;

export function StatCard({
  label,
  value,
  sublabel,
  delta,
  icon,
  chipTone = "gold",
  tone = "default",
  onClick,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  delta?: string;
  icon?: StatIconName;
  chipTone?: keyof typeof chipToneClasses;
  tone?: "default" | "warning" | "error";
  onClick?: () => void;
}) {
  const Icon = icon ? ICONS[icon] : null;
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-xl border border-border bg-surface-base p-5 text-left shadow-sm transition-colors",
        onClick && "cursor-pointer hover:border-teal",
        tone === "warning" && "border-status-warning/40",
        tone === "error" && "border-status-error/40"
      )}
    >
      {Icon && (
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            chipToneClasses[chipTone]
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-400">
          {label}
        </span>
        <span className="text-2xl font-semibold text-ink-900">{value}</span>
        {(sublabel || delta) && (
          <span className="text-sm text-ink-500">
            {delta && <span className="font-medium text-ink-700">{delta} </span>}
            {sublabel}
          </span>
        )}
      </div>
    </Wrapper>
  );
}
