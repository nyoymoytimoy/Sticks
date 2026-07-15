import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  accentWord,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  accentWord?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          {eyebrow && (
            <span className="w-fit rounded-pill border border-border bg-surface-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal">
              {eyebrow}
            </span>
          )}
          <h1 className="text-3xl font-semibold text-ink-900">
            {title}
            {accentWord && <span className="text-gold-dark"> {accentWord}</span>}
          </h1>
          {subtitle && <p className="max-w-2xl text-ink-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
