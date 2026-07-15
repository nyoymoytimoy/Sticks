"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Ticket, FileBarChart, Users, History, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Icons are referenced by name (a serializable string), not passed as
// component references, because this file is a Client Component and the
// nav sections are built server-side (in the protected layout) -- React
// can't serialize a function/component reference across that boundary.
const ICONS = {
  dashboard: LayoutDashboard,
  tickets: Ticket,
  reports: FileBarChart,
  users: Users,
  audit: History,
} as const;

export type IconName = keyof typeof ICONS;

export type NavItem = {
  href: string;
  label: string;
  icon?: IconName;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export function Sidebar({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface-base px-4 py-6">
      <div className="flex flex-col gap-0.5 border-b border-border px-2 pb-5">
        <span className="text-xl font-bold tracking-tight text-ink-900">
          Sticks<span className="text-gold-dark">.</span>
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-teal">
          Ticketing
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-5">
        {sections.map((section, i) => (
          <div key={section.title ?? i} className="flex flex-col gap-1">
            {section.title && (
              <span className="px-3 text-xs font-bold uppercase tracking-wide text-ink-400">
                {section.title}
              </span>
            )}
            {section.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon ? ICONS[item.icon] : null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-pill px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-gold text-ink-900"
                      : "text-ink-500 hover:bg-surface-secondary hover:text-ink-900"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <Link
        href="/tickets/new"
        className="flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 text-sm font-semibold text-ink-900 shadow-[0_4px_14px_var(--color-gold-glow)] transition-colors hover:bg-gold-dark"
      >
        <Plus className="h-4 w-4" />
        New Ticket
      </Link>
    </aside>
  );
}
