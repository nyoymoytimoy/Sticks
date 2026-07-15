import { getAssignableUsers } from "backend";
import { PageHeader } from "@/components/ui/page-header";
import { ServiceRequestCreateForm } from "./create-form";

export default async function NewServiceRequestPage() {
  const assignableUsers = await getAssignableUsers();

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        breadcrumb={[
          { label: "Tickets", href: "/tickets" },
          { label: "New", href: "/tickets/new" },
          { label: "Service Request" },
        ]}
        title="Service"
        accentWord="Request"
      />
      <div className="rounded-xl border border-border bg-surface-base p-6 shadow-sm">
        <ServiceRequestCreateForm assignableUsers={assignableUsers} />
      </div>
    </div>
  );
}
