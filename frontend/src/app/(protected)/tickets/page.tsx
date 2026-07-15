import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth/authOptions";
import { listTicketsForViewer } from "backend";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { TicketsDataTable } from "@/components/tickets/tickets-data-table";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await getServerSession(authOptions);
  const tickets = await listTicketsForViewer(Number(session!.user.id), session!.user.roles);

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        breadcrumb={[{ label: "Tickets" }]}
        title="All"
        accentWord="Tickets"
        actions={
          <Link href="/tickets/new">
            <Button>New Ticket</Button>
          </Link>
        }
      />
      <div className="rounded-xl border border-border bg-surface-base p-5 shadow-sm">
        <TicketsDataTable tickets={tickets} initialSearch={q ?? ""} />
      </div>
    </div>
  );
}
