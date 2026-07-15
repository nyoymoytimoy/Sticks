import type { ReactNode } from "react";
import type { FieldError } from "react-hook-form";
import { cn } from "@/lib/utils";

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 last:border-b-0 last:pb-0">
      <h3 className="text-xs font-bold uppercase tracking-wide text-teal">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function Field({
  label,
  error,
  full,
  children,
}: {
  label: string;
  error?: FieldError;
  /** Spans both grid columns -- use for text areas and long titles. */
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm font-medium text-ink-700", full && "sm:col-span-2")}>
      {label}
      {children}
      {error && <span className="text-xs font-normal text-status-error">{error.message}</span>}
    </label>
  );
}

export const inputClass =
  "h-11 rounded-lg border border-border bg-surface-secondary px-3 text-sm text-ink-900 outline-none transition-colors focus:border-teal focus:bg-surface-base";
export const textareaClass =
  "min-h-24 rounded-lg border border-border bg-surface-secondary px-3 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-teal focus:bg-surface-base";
