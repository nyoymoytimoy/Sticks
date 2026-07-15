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
    <aside className="flex h-full w-64 shrink-0 flex-col gap-6 bg-ink-900 px-4 py-6 text-white">
      <span className="flex items-center gap-2 px-2 text-lg font-semibold tracking-tight text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-ink-900">
          🎫
        </span>
        Sticks
      </span>

      <nav className="flex flex-1 flex-col gap-5">
        {sections.map((section, i) => (
          <div key={section.title ?? i} className="flex flex-col gap-1">
            {section.title && (
              <span className="px-3 text-xs font-bold uppercase tracking-wide text-white/40">
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
                      : "text-white/70 hover:bg-white/10 hover:text-white"
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
