import { pool } from "../pool";

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

export async function getRecentAuditEvents(limit = 100): Promise<AuditLogRow[]> {
  const result = await pool.query(
    `SELECT a.id, a.ticket_id, t.ticket_number, a.event_type,
            u.name AS actor_name, a.from_value, a.to_value, a.note, a.occurred_at
       FROM ticket_audit_log a
       JOIN tickets t ON t.id = a.ticket_id
       LEFT JOIN users u ON u.id = a.actor_user_id
      ORDER BY a.occurred_at DESC
      LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    ticketId: row.ticket_id,
    ticketNumber: row.ticket_number,
    eventType: row.event_type,
    actorName: row.actor_name,
    fromValue: row.from_value,
    toValue: row.to_value,
    note: row.note,
    occurredAt: row.occurred_at,
  }));
}

export async function getAuditEventsForTicket(ticketId: number): Promise<AuditLogRow[]> {
  const result = await pool.query(
    `SELECT a.id, a.ticket_id, t.ticket_number, a.event_type,
            u.name AS actor_name, a.from_value, a.to_value, a.note, a.occurred_at
       FROM ticket_audit_log a
       JOIN tickets t ON t.id = a.ticket_id
       LEFT JOIN users u ON u.id = a.actor_user_id
      WHERE a.ticket_id = $1
      ORDER BY a.occurred_at ASC`,
    [ticketId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    ticketId: row.ticket_id,
    ticketNumber: row.ticket_number,
    eventType: row.event_type,
    actorName: row.actor_name,
    fromValue: row.from_value,
    toValue: row.to_value,
    note: row.note,
    occurredAt: row.occurred_at,
  }));
}
