"use client";

import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { TicketListRow } from "backend/client";

const columns: Column<TicketListRow>[] = [
  { key: "ticketNumber", header: "Ticket", render: (r) => r.ticketNumber },
  { key: "title", header: "Title", render: (r) => r.title },
  { key: "typeLabel", header: "Type", render: (r) => r.typeLabel },
  { key: "statusCode", header: "Status", render: (r) => <StatusBadge status={r.statusCode} /> },
  { key: "priority", header: "Priority", render: (r) => r.priority },
  { key: "requestorName", header: "Requestor", render: (r) => r.requestorName ?? "—" },
  { key: "assigneeName", header: "Assignee", render: (r) => r.assigneeName ?? "—" },
];

export function TicketsDataTable({ tickets }: { tickets: TicketListRow[] }) {
  const router = useRouter();
  return (
    <DataTable
      columns={columns}
      data={tickets}
      onRowClick={(row) => router.push(`/tickets/${row.id}`)}
      emptyTitle="No tickets yet"
      emptyDescription="Create your first ticket to get started."
    />
  );
}
