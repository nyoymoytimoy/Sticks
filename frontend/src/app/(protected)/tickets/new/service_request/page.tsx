import { getAssignableUsers } from "backend";
import { PageHeader } from "@/components/ui/page-header";
import { ServiceRequestCreateForm } from "./create-form";

export default async function NewServiceRequestPage() {
  const assignableUsers = await getAssignableUsers();

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader eyebrow="New Ticket" title="Service" accentWord="Request" />
      <ServiceRequestCreateForm assignableUsers={assignableUsers} />
    </div>
  );
}
