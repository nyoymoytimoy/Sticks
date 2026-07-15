import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { PageHeader } from "@/components/ui/page-header";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        eyebrow="Dashboard"
        title="Welcome,"
        accentWord={session?.user.name ?? ""}
        subtitle="KPIs, aging/SLA, and approval-backlog widgets land in spec 015."
      />
    </div>
  );
}
