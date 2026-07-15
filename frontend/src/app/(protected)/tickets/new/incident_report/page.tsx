import { PageHeader } from "@/components/ui/page-header";
import { IncidentReportCreateForm } from "@/components/tickets/incident-report-create-form";

export default function NewIncidentReportPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader eyebrow="New Ticket" title="Incident" accentWord="Report" />
      <IncidentReportCreateForm />
    </div>
  );
}
