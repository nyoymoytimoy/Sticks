"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export function Sidebar({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col gap-6 border-r border-border bg-surface-secondary px-4 py-6">
      <span className="px-2 text-lg font-semibold tracking-tight text-ink-900">
        Sticks
      </span>
      <nav className="flex flex-col gap-4">
        {sections.map((section, i) => (
          <div key={section.title ?? i} className="flex flex-col gap-1">
            {section.title && (
              <span className="px-2 text-xs font-bold uppercase tracking-wide text-teal">
                {section.title}
              </span>
            )}
            {section.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-pill px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-gold/20 text-gold-dark"
                      : "text-ink-500 hover:bg-surface-base hover:text-ink-900"
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
    </aside>
  );
}
