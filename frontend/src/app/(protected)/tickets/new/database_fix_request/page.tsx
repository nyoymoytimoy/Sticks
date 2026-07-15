import { PageHeader } from "@/components/ui/page-header";
import { DbChangeCreateForm } from "@/components/tickets/db-change-create-form";

export default function NewDatabaseFixRequestPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        breadcrumb={[
          { label: "Tickets", href: "/tickets" },
          { label: "New", href: "/tickets/new" },
          { label: "Database Fix Request" },
        ]}
        title="Database Fix"
        accentWord="Request"
      />
      <div className="rounded-xl border border-border bg-surface-base p-6 shadow-sm">
        <DbChangeCreateForm type="database_fix_request" />
      </div>
    </div>
  );
}
