import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/authOptions";
import { canAccessPage } from "backend";
import { Sidebar, type NavSection } from "@/components/ui/sidebar";
import { SignOutButton } from "@/components/ui/sign-out-button";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const roles = session.user.roles;

  const sections: NavSection[] = [
    {
      items: [
        ...(canAccessPage(roles, "dashboard")
          ? [{ href: "/dashboard", label: "Dashboard", icon: "dashboard" as const }]
          : []),
        ...(canAccessPage(roles, "tickets")
          ? [{ href: "/tickets", label: "Tickets", icon: "tickets" as const }]
          : []),
        ...(canAccessPage(roles, "reports")
          ? [{ href: "/reports", label: "Reports", icon: "reports" as const }]
          : []),
      ],
    },
    ...(canAccessPage(roles, "adminUsers") || canAccessPage(roles, "adminAudit")
      ? [
          {
            title: "Admin",
            items: [
              ...(canAccessPage(roles, "adminUsers")
                ? [{ href: "/admin/users", label: "Users", icon: "users" as const }]
                : []),
              ...(canAccessPage(roles, "adminAudit")
                ? [{ href: "/admin/audit", label: "Audit", icon: "audit" as const }]
                : []),
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar sections={sections} />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface-base px-6 py-3">
          <span className="text-sm text-ink-500">
            Signed in as <span className="font-medium text-ink-900">{session.user.name}</span>
          </span>
          <SignOutButton />
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
