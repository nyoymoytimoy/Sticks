import { PageHeader } from "@/components/ui/page-header";
import { IncidentReportCreateForm } from "@/components/tickets/incident-report-create-form";

export default function NewIncidentReportPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        breadcrumb={[
          { label: "Tickets", href: "/tickets" },
          { label: "New", href: "/tickets/new" },
          { label: "Incident Report" },
        ]}
        title="Incident"
        accentWord="Report"
      />
      <div className="rounded-xl border border-border bg-surface-base p-6 shadow-sm">
        <IncidentReportCreateForm />
      </div>
    </div>
  );
}
