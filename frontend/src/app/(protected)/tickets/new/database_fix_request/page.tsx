import { PageHeader } from "@/components/ui/page-header";
import { DbChangeCreateForm } from "@/components/tickets/db-change-create-form";

export default function NewDatabaseFixRequestPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader eyebrow="New Ticket" title="Database Fix" accentWord="Request" />
      <DbChangeCreateForm type="database_fix_request" />
    </div>
  );
}
