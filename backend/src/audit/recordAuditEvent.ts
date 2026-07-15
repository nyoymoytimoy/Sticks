import type { Pool, PoolClient } from "pg";
import { pool } from "../db/pool";

export type AuditEventType =
  | "status_change"
  | "tag_added"
  | "tag_removed"
  | "assignment_changed"
  | "comment_added";

export type RecordAuditEventInput = {
  ticketId: number;
  eventType: AuditEventType;
  actorUserId: number | null;
  fromValue?: string | null;
  toValue?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Writes one audit_log row. Accepts an optional `client` so callers (the
 * workflow engine, spec 007+) can call this inside their own transaction --
 * the audit write and the status/assignment change it records must commit
 * or roll back together.
 */
export async function recordAuditEvent(
  input: RecordAuditEventInput,
  client: Pool | PoolClient = pool
): Promise<{ id: number }> {
  const result = await client.query(
    `INSERT INTO ticket_audit_log
       (ticket_id, event_type, actor_user_id, from_value, to_value, note, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      input.ticketId,
      input.eventType,
      input.actorUserId,
      input.fromValue ?? null,
      input.toValue ?? null,
      input.note ?? null,
      JSON.stringify(input.metadata ?? {}),
    ]
  );
  return { id: result.rows[0].id };
}
