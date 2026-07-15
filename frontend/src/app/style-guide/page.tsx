"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/ui/data-table";
import { AuditTimeline } from "@/components/ui/audit-timeline";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { useToast } from "@/components/ui/toast";

const STATUSES = [
  "new",
  "pending_approval",
  "in_progress",
  "for_discussion",
  "reopened",
  "done",
  "declined",
];

type DemoRow = { id: number; title: string; type: string; status: string };

const DEMO_ROWS: DemoRow[] = [
  { id: 1, title: "Fix duplicate policy rows", type: "Database Fix Request", status: "pending_approval" },
  { id: 2, title: "Whitelist vendor IP range", type: "BCP Whitelisting", status: "assigned" },
  { id: 3, title: "Portal outage this morning", type: "Incident Report", status: "acknowledged" },
];

const columns: Column<DemoRow>[] = [
  { key: "title", header: "Title", render: (r) => r.title },
  { key: "type", header: "Type", render: (r) => r.type },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
];

function ToastDemoButton() {
  const { push } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() =>
        push({ title: "Ticket updated", description: "Status changed to In Progress.", tone: "success" })
      }
    >
      Trigger toast
    </Button>
  );
}

export default function StyleGuidePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 p-8">
      <PageHeader
        breadcrumb={[{ label: "Design System" }, { label: "Style Guide" }]}
        eyebrow="Design System"
        title="Sticks"
        accentWord="Style Guide"
        subtitle="Every base component in one place, styled with the Audit V4 token set."
        actions={<ToastDemoButton />}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-teal">Breadcrumbs</h2>
        <Breadcrumbs items={[{ label: "Tickets", href: "/tickets" }, { label: "TCK-2026-000001" }]} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-teal">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Decline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" loading>
            Loading
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-teal">Status badges</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-teal">Stat cards</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon="ticket" chipTone="gold" label="Open Tickets" value={42} sublabel="+3 this week" />
          <StatCard
            icon="warning"
            chipTone="warning"
            label="DB Fix Backlog — Leiva Morente"
            value={5}
            tone="warning"
            sublabel="oldest: 4d"
          />
          <StatCard icon="error" chipTone="error" label="Declined" value={2} tone="error" />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-teal">Tabs</h2>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="aging">Aging & SLA</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Overview content.</TabsContent>
          <TabsContent value="aging">Aging & SLA content.</TabsContent>
        </Tabs>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-teal">Data table + filter row</h2>
        <DataTable columns={columns} data={DEMO_ROWS} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-teal">Empty state</h2>
        <EmptyState title="No tickets yet" description="Create your first ticket to get started." />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-teal">Audit timeline</h2>
        <AuditTimeline
          events={[
            {
              id: 1,
              actorName: "Leiva Morente",
              action: "approved the ticket",
              fromValue: "pending_approval",
              toValue: "approved",
              occurredAt: "2026-07-15T13:00:00.000Z",
            },
          ]}
        />
      </section>
    </div>
  );
}
