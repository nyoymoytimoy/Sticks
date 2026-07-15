// Pure, dependency-free shared types. Anything that needs to be importable
// from a Client Component (via ./client.ts) must have its type defined here
// or in another zero-dependency file -- never in a file that also imports
// `pg` (see client.ts's comment for why).

export type AssignableUser = { id: number; name: string | null; email: string };

export type TicketListRow = {
  id: number;
  ticketNumber: string;
  title: string;
  typeCode: string;
  typeLabel: string;
  statusCode: string;
  statusLabel: string;
  priority: string;
  requestorName: string | null;
  assigneeName: string | null;
  createdAt: string;
};

export type TicketDetail = TicketListRow & {
  description: string | null;
  requestorId: number;
};

export type AuditLogRow = {
  id: number;
  ticketId: number;
  ticketNumber: string;
  eventType: string;
  actorName: string | null;
  fromValue: string | null;
  toValue: string | null;
  note: string | null;
  occurredAt: string;
};
