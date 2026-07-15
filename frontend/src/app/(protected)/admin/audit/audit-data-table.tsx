"use client";

import { DataTable, type Column } from "@/components/ui/data-table";
import type { AuditLogRow } from "backend/client";

// A thin client wrapper around DataTable: column definitions include JSX
// render functions, which (like the sidebar icon bug in spec 004) cannot be
// passed as props from a Server Component -- they must be defined here, in
// a Client Component, not in the server page that fetches the data.
const columns: Column<AuditLogRow>[] = [
  { key: "ticketNumber", header: "Ticket", render: (r) => r.ticketNumber },
  { key: "eventType", header: "Event", render: (r) => r.eventType.replace(/_/g, " ") },
  { key: "actorName", header: "Actor", render: (r) => r.actorName ?? "—" },
  {
    key: "change",
    header: "Change",
    render: (r) => (r.fromValue && r.toValue ? `${r.fromValue} → ${r.toValue}` : "—"),
  },
  { key: "note", header: "Note", render: (r) => r.note ?? "—" },
  {
    key: "occurredAt",
    header: "When",
    render: (r) => new Date(r.occurredAt).toLocaleString(),
  },
];

export function AuditDataTable({ events }: { events: AuditLogRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={events}
      emptyTitle="No audit events yet"
      emptyDescription="Status, assignment, and tag changes will appear here once tickets start moving through their workflows."
    />
  );
}
