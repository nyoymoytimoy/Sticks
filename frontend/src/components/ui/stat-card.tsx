import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sublabel,
  delta,
  icon: Icon,
  tone = "default",
  onClick,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  delta?: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: "default" | "warning" | "error";
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-surface-stat p-5 text-left transition-colors",
        onClick && "cursor-pointer hover:border-teal",
        tone === "warning" && "border-status-warning/40",
        tone === "error" && "border-status-error/40"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-teal">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-ink-400" />}
      </div>
      <span className="text-3xl font-semibold text-ink-900">{value}</span>
      {(sublabel || delta) && (
        <span className="text-sm text-ink-500">
          {delta && <span className="font-medium text-ink-700">{delta} </span>}
          {sublabel}
        </span>
      )}
    </Wrapper>
  );
}
