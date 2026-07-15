import { PageHeader } from "@/components/ui/page-header";
import { BcpCreateForm } from "@/components/tickets/bcp-create-form";

export default function NewBcpWhitelistingRequestPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        breadcrumb={[
          { label: "Tickets", href: "/tickets" },
          { label: "New", href: "/tickets/new" },
          { label: "BCP Whitelisting" },
        ]}
        title="BCP"
        accentWord="Whitelisting"
      />
      <div className="rounded-xl border border-border bg-surface-base p-6 shadow-sm">
        <BcpCreateForm />
      </div>
    </div>
  );
}
