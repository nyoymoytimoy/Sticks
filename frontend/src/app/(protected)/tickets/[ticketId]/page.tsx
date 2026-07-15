import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/authOptions";
import { getTicketById, getAuditEventsForTicket } from "backend";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AuditTimeline } from "@/components/ui/audit-timeline";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const session = await getServerSession(authOptions);

  const ticket = await getTicketById(Number(ticketId));
  if (!ticket) notFound();

  const isPrivileged = session!.user.roles.some((r) =>
    ["approver", "admin", "associate"].includes(r)
  );
  if (!isPrivileged && ticket.requestorId !== Number(session!.user.id)) {
    redirect("/tickets");
  }

  const auditEvents = await getAuditEventsForTicket(ticket.id);

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        breadcrumb={[{ label: "Tickets", href: "/tickets" }, { label: ticket.ticketNumber }]}
        eyebrow={ticket.typeLabel}
        title={ticket.ticketNumber}
        subtitle={ticket.title}
        actions={<StatusBadge status={ticket.statusCode} />}
      />

      <div className="rounded-xl border border-border bg-surface-base p-5 shadow-sm">
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity & Audit</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <dl className="grid max-w-2xl grid-cols-2 gap-4 text-sm">
              <dt className="text-ink-500">Description</dt>
              <dd className="col-span-1 text-ink-900">{ticket.description ?? "—"}</dd>
              <dt className="text-ink-500">Priority</dt>
              <dd className="text-ink-900">{ticket.priority}</dd>
              <dt className="text-ink-500">Requestor</dt>
              <dd className="text-ink-900">{ticket.requestorName}</dd>
              <dt className="text-ink-500">Assignee</dt>
              <dd className="text-ink-900">{ticket.assigneeName ?? "—"}</dd>
              <dt className="text-ink-500">Created</dt>
              <dd className="text-ink-900">{new Date(ticket.createdAt).toLocaleString()}</dd>
            </dl>
          </TabsContent>
          <TabsContent value="activity">
            <AuditTimeline
              events={auditEvents.map((e) => ({
                id: e.id,
                actorName: e.actorName ?? "System",
                action: e.eventType.replace(/_/g, " "),
                fromValue: e.fromValue,
                toValue: e.toValue,
                note: e.note,
                occurredAt: e.occurredAt,
              }))}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
