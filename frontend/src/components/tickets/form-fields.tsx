import type { ReactNode } from "react";
import type { FieldError } from "react-hook-form";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: FieldError;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-ink-700">
      {label}
      {children}
      {error && <span className="text-xs text-status-error">{error.message}</span>}
    </label>
  );
}

export const inputClass =
  "h-10 rounded-md border border-border bg-surface-base px-3 outline-none focus:border-teal";
export const textareaClass =
  "min-h-24 rounded-md border border-border bg-surface-base px-3 py-2 outline-none focus:border-teal";
