"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SignOutButton } from "@/components/ui/sign-out-button";

export function Topbar({ userName }: { userName: string | null | undefined }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/tickets?q=${encodeURIComponent(query)}`);
  }

  const initials = (userName ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface-base px-6 py-3">
      <form onSubmit={handleSearch} className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tickets…"
          className="h-10 w-full rounded-pill border border-border bg-surface-secondary pl-9 pr-3 text-sm outline-none focus:border-teal"
        />
      </form>

      <div className="flex shrink-0 items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-sm font-semibold text-white">
          {initials}
        </span>
        <span className="text-sm text-ink-500">
          Signed in as <span className="font-medium text-ink-900">{userName}</span>
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
