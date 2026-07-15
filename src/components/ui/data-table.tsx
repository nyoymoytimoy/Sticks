"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  /** Value used by the shared search/filter row; defaults to render() text if omitted. */
  filterValue?: (row: T) => string;
};

type MatchMode = "contains" | "equals" | "starts_with";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * The standardized filter row (search + match-mode + value + page size) used
 * everywhere tabular ticket data is shown, so users learn one filtering
 * pattern across Tickets, Reports, Admin Users, and the Audit view.
 */
export function DataTable<T>({
  columns,
  data,
  filterFields,
  defaultPageSize = 25,
  onRowClick,
  emptyTitle = "No results",
  emptyDescription,
}: {
  columns: Column<T>[];
  data: T[];
  /** Which columns the search box is allowed to filter on. Defaults to all. */
  filterFields?: string[];
  defaultPageSize?: number;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [search, setSearch] = useState("");
  const [matchMode, setMatchMode] = useState<MatchMode>("contains");
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [page, setPage] = useState(1);

  const searchableColumns = useMemo(
    () =>
      filterFields
        ? columns.filter((c) => filterFields.includes(c.key))
        : columns,
    [columns, filterFields]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const needle = search.trim().toLowerCase();
    return data.filter((row) =>
      searchableColumns.some((col) => {
        const value = (col.filterValue?.(row) ?? String(col.render(row) ?? "")).toLowerCase();
        if (matchMode === "equals") return value === needle;
        if (matchMode === "starts_with") return value.startsWith(needle);
        return value.includes(needle);
      })
    );
  }, [data, search, matchMode, searchableColumns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search…"
          className="h-9 min-w-48 flex-1 rounded-md border border-border bg-surface-base px-3 text-sm text-ink-900 outline-none focus:border-teal"
        />
        <select
          value={matchMode}
          onChange={(e) => setMatchMode(e.target.value as MatchMode)}
          className="h-9 rounded-md border border-border bg-surface-base px-2 text-sm text-ink-700"
        >
          <option value="contains">Contains</option>
          <option value="equals">Equals</option>
          <option value="starts_with">Starts with</option>
        </select>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="h-9 rounded-md border border-border bg-surface-base px-2 text-sm text-ink-700"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-secondary text-xs font-bold uppercase tracking-wide text-teal">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-t border-border",
                    onRowClick && "cursor-pointer hover:bg-surface-secondary"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-ink-700">
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-ink-500">
          <span>
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-border px-2 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-border px-2 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
