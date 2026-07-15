import { PageHeader } from "@/components/ui/page-header";
import { BcpCreateForm } from "@/components/tickets/bcp-create-form";

export default function NewBcpWhitelistingRequestPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader eyebrow="New Ticket" title="BCP" accentWord="Whitelisting" />
      <BcpCreateForm />
    </div>
  );
}
