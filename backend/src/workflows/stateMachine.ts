import type { QueryResult, QueryResultRow } from "pg";
import { pool } from "../db/pool";
import { recordAuditEvent } from "../audit/recordAuditEvent";
import type { AvailableAction } from "../types";

export type { AvailableAction };

// Both `Pool` and `PoolClient` satisfy this -- lets read-only helpers
// (resolveWorkflowAssignee, isAuthorized) run against either the shared
// pool (getAvailableActions, read-only) or a transaction client
// (applyTicketTransition, read-write) without an unsound cast.
type Queryable = {
  query<R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<R>>;
};

type TicketRow = {
  id: number;
  ticket_type_id: number;
  status_id: number;
  requestor_id: number;
  approver_id: number | null;
  current_assignee_id: number | null;
  closed_at: string | null;
};

type TransitionRow = {
  id: number;
  to_status_id: number;
  workflow_step: "approver" | "admin" | null;
  assigns_to_step: "approver" | "admin" | null;
  allowed_role_code: string | null;
  requires_note: boolean;
  notify_spec: { relations?: string[]; exclusive_step?: "approver" | "admin" };
};

export type ApplyTransitionResult =
  | { ok: true }
  | { ok: false; error: string };

const REOPEN_WINDOW_DAYS = 7;

/**
 * Looks up whoever currently holds an exclusive workflow step for a ticket
 * type -- the primary exclusive assignee, or their active delegate if one
 * is on file for today's date (see approver_delegations; no delegations
 * exist until spec 014, but the check is correct now regardless).
 */
async function resolveWorkflowAssignee(
  client: Queryable,
  ticketTypeId: number,
  step: "approver" | "admin"
): Promise<{ exclusiveUserId: number; delegateUserId: number | null } | null> {
  const result = await client.query(
    `SELECT wa.id, wa.user_id,
            (SELECT ad.delegate_user_id FROM approver_delegations ad
              WHERE ad.workflow_assignment_id = wa.id
                AND CURRENT_DATE BETWEEN ad.start_date AND ad.end_date
              ORDER BY ad.created_at DESC LIMIT 1) AS delegate_user_id
       FROM workflow_assignments wa
      WHERE wa.ticket_type_id = $1 AND wa.workflow_step = $2 AND wa.is_exclusive = true
        AND (wa.effective_to IS NULL OR wa.effective_to > now())
      LIMIT 1`,
    [ticketTypeId, step]
  );
  const row = result.rows[0];
  if (!row) return null;
  return { exclusiveUserId: row.user_id, delegateUserId: row.delegate_user_id };
}

async function isAuthorized(
  client: Queryable,
  ticket: TicketRow,
  transition: TransitionRow,
  actionCode: string,
  actorUserId: number,
  actorRoles: string[]
): Promise<boolean> {
  // These two actions aren't gated by a workflow step or role -- they're
  // authorized by relation to the ticket itself (the requestor).
  if (actionCode === "resubmit") {
    return actorUserId === ticket.requestor_id;
  }
  if (actionCode === "reopen") {
    if (actorUserId === ticket.requestor_id) return true;
    const admin = await resolveWorkflowAssignee(client, ticket.ticket_type_id, "admin");
    return admin ? actorUserId === admin.exclusiveUserId || actorUserId === admin.delegateUserId : false;
  }

  if (transition.workflow_step) {
    const assignment = await resolveWorkflowAssignee(client, ticket.ticket_type_id, transition.workflow_step);
    if (assignment) {
      // An exclusive assignment exists for this type+step: ONLY the named
      // user or their active delegate may act, regardless of role --
      // this is what enforces "only Leiva can approve" rather than "any
      // approver can."
      return actorUserId === assignment.exclusiveUserId || actorUserId === assignment.delegateUserId;
    }
  }

  if (transition.allowed_role_code) {
    return actorRoles.includes(transition.allowed_role_code);
  }

  return false;
}

function checkReopenWindow(ticket: TicketRow): string | null {
  if (!ticket.closed_at) return "This ticket was never closed.";
  const closedAt = new Date(ticket.closed_at).getTime();
  const ageMs = Date.now() - closedAt;
  if (ageMs > REOPEN_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
    return `The ${REOPEN_WINDOW_DAYS}-day reopen window has passed.`;
  }
  return null;
}

async function resolveNotifyRecipients(
  client: Queryable,
  ticket: TicketRow,
  notifySpec: TransitionRow["notify_spec"]
): Promise<number[]> {
  const recipients = new Set<number>();

  for (const relation of notifySpec.relations ?? []) {
    if (relation === "requestor") recipients.add(ticket.requestor_id);
    if (relation === "approver" && ticket.approver_id) recipients.add(ticket.approver_id);
    if (relation === "assignee" && ticket.current_assignee_id) recipients.add(ticket.current_assignee_id);
  }

  if (notifySpec.exclusive_step) {
    const assignment = await resolveWorkflowAssignee(client, ticket.ticket_type_id, notifySpec.exclusive_step);
    if (assignment) recipients.add(assignment.delegateUserId ?? assignment.exclusiveUserId);
  }

  return Array.from(recipients);
}

export async function applyTicketTransition(input: {
  ticketId: number;
  actorUserId: number;
  actorRoles: string[];
  actionCode: string;
  note?: string;
}): Promise<ApplyTransitionResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ticketResult = await client.query<TicketRow>(
      `SELECT id, ticket_type_id, status_id, requestor_id, approver_id, current_assignee_id, closed_at
         FROM tickets WHERE id = $1 FOR UPDATE`,
      [input.ticketId]
    );
    const ticket = ticketResult.rows[0];
    if (!ticket) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Ticket not found." };
    }

    const transitionResult = await client.query<TransitionRow>(
      `SELECT id, to_status_id, workflow_step, assigns_to_step, allowed_role_code, requires_note, notify_spec
         FROM ticket_type_workflow_transitions
        WHERE ticket_type_id = $1 AND from_status_id = $2 AND action_code = $3`,
      [ticket.ticket_type_id, ticket.status_id, input.actionCode]
    );
    const transition = transitionResult.rows[0];
    if (!transition) {
      await client.query("ROLLBACK");
      return { ok: false, error: "This action isn't available for the ticket's current status." };
    }

    if (input.actionCode === "reopen") {
      const windowError = checkReopenWindow(ticket);
      if (windowError) {
        await client.query("ROLLBACK");
        return { ok: false, error: windowError };
      }
    }

    const authorized = await isAuthorized(
      client,
      ticket,
      transition,
      input.actionCode,
      input.actorUserId,
      input.actorRoles
    );
    if (!authorized) {
      await client.query("ROLLBACK");
      return { ok: false, error: "You're not authorized to perform this action." };
    }

    if (transition.requires_note && !input.note?.trim()) {
      await client.query("ROLLBACK");
      return { ok: false, error: "A note is required for this action." };
    }

    let newAssigneeId: number | null = null;
    if (transition.assigns_to_step) {
      const assignment = await resolveWorkflowAssignee(client, ticket.ticket_type_id, transition.assigns_to_step);
      newAssigneeId = assignment ? (assignment.delegateUserId ?? assignment.exclusiveUserId) : null;
    }

    const statusCodes = await client.query(
      `SELECT id, code, is_terminal FROM ticket_statuses WHERE id IN ($1, $2)`,
      [ticket.status_id, transition.to_status_id]
    );
    const codeById = new Map(statusCodes.rows.map((r) => [r.id, r.code]));
    const toStatusIsTerminal = statusCodes.rows.find((r) => r.id === transition.to_status_id)?.is_terminal ?? false;

    // Reopening un-terminates a ticket, so its own transition (to
    // in_progress, is_terminal=false) correctly clears closed_at here --
    // no special-casing needed beyond trusting is_terminal.
    await client.query(
      `UPDATE tickets
          SET status_id = $1,
              current_assignee_id = COALESCE($2, current_assignee_id),
              closed_at = CASE WHEN $3 THEN now() ELSE NULL END
        WHERE id = $4`,
      [transition.to_status_id, newAssigneeId, toStatusIsTerminal, ticket.id]
    );

    await recordAuditEvent(
      {
        ticketId: ticket.id,
        eventType: "status_change",
        actorUserId: input.actorUserId,
        fromValue: codeById.get(ticket.status_id) ?? String(ticket.status_id),
        toValue: codeById.get(transition.to_status_id) ?? String(transition.to_status_id),
        note: input.note ?? null,
      },
      client
    );

    const recipients = await resolveNotifyRecipients(client, ticket, transition.notify_spec ?? {});
    for (const recipientId of recipients) {
      await client.query(
        `INSERT INTO notification_events (ticket_id, recipient_user_id, event_type, subject, payload)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          ticket.id,
          recipientId,
          input.actionCode,
          `Ticket update: ${input.actionCode.replace(/_/g, " ")}`,
          JSON.stringify({ actionCode: input.actionCode, note: input.note ?? null }),
        ]
      );
    }

    await client.query("COMMIT");
    return { ok: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Read-only: which actions can THIS actor take on THIS ticket right now.
 * Powers the ticket detail page's action buttons -- it runs the exact same
 * authorization check as applyTicketTransition, just without mutating
 * anything, so the buttons shown always match what will actually succeed.
 */
export async function getAvailableActions(
  ticketId: number,
  actorUserId: number,
  actorRoles: string[]
): Promise<AvailableAction[]> {
  const ticketResult = await pool.query<TicketRow>(
    `SELECT id, ticket_type_id, status_id, requestor_id, approver_id, current_assignee_id, closed_at
       FROM tickets WHERE id = $1`,
    [ticketId]
  );
  const ticket = ticketResult.rows[0];
  if (!ticket) return [];

  const transitionsResult = await pool.query<TransitionRow & { action_code: string; to_status_label: string }>(
    `SELECT t.id, t.to_status_id, t.workflow_step, t.assigns_to_step, t.allowed_role_code,
            t.requires_note, t.notify_spec, t.action_code, ts.label AS to_status_label
       FROM ticket_type_workflow_transitions t
       JOIN ticket_statuses ts ON ts.id = t.to_status_id
      WHERE t.ticket_type_id = $1 AND t.from_status_id = $2`,
    [ticket.ticket_type_id, ticket.status_id]
  );

  const available: AvailableAction[] = [];
  for (const row of transitionsResult.rows) {
    if (row.action_code === "reopen" && checkReopenWindow(ticket)) continue;
    const authorized = await isAuthorized(pool, ticket, row, row.action_code, actorUserId, actorRoles);
    if (authorized) {
      available.push({
        actionCode: row.action_code,
        toStatusLabel: row.to_status_label,
        requiresNote: row.requires_note,
      });
    }
  }
  return available;
}
