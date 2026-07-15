import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/authOptions";
import { canAccessPage, getRecentAuditEvents, type AuditLogRow } from "backend";
import { PageHeader } from "@/components/ui/page-header";
import { AuditDataTable } from "./audit-data-table";

export default async function AdminAuditPage() {
  const session = await getServerSession(authOptions);
  if (!session || !canAccessPage(session.user.roles, "adminAudit")) {
    redirect("/dashboard");
  }

  const events: AuditLogRow[] = await getRecentAuditEvents();

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        eyebrow="Admin"
        title="Audit"
        accentWord="Trail"
        subtitle="Every status, assignment, and tag change across every ticket, most recent first."
      />
      <AuditDataTable events={events} />
    </div>
  );
}
