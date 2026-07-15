import { PageHeader } from "@/components/ui/page-header";
import { DbChangeCreateForm } from "@/components/tickets/db-change-create-form";

export default function NewMassRequestPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader eyebrow="New Ticket" title="Mass" accentWord="Request" />
      <DbChangeCreateForm type="mass_request" />
    </div>
  );
}
