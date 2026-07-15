import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

const TYPE_TILES = [
  {
    href: "/tickets/new/database_fix_request",
    label: "Database Fix Request",
    description: "Request a data correction or fix, subject to approval.",
  },
  {
    href: "/tickets/new/mass_request",
    label: "Mass Request",
    description: "Request a bulk data change, subject to approval.",
  },
  {
    href: "/tickets/new/bcp_whitelisting_request",
    label: "BCP (Whitelisting) Request",
    description: "Request an IP/domain be whitelisted.",
  },
  {
    href: "/tickets/new/incident_report",
    label: "Incident Report",
    description: "Report an error or outage.",
  },
  {
    href: "/tickets/new/service_request",
    label: "Service Request",
    description: "Request a service from a specific Associate or Admin.",
  },
];

export default function NewTicketPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader eyebrow="Tickets" title="New" accentWord="Ticket" subtitle="Choose a request type." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TYPE_TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface-secondary p-5 transition-colors hover:border-teal"
          >
            <span className="font-semibold text-ink-900">{tile.label}</span>
            <span className="text-sm text-ink-500">{tile.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
