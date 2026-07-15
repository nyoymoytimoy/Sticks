import type { PoolClient } from "pg";
import { pool } from "../pool";
import { recordAuditEvent } from "../../audit/recordAuditEvent";
import type {
  TicketTypeCode,
  TicketDetailsFor,
} from "../../validation/ticketSchemas";
import type { TicketListRow, TicketDetail } from "../../types";

export type { TicketListRow, TicketDetail };

type BaseTicketInput = {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "critical";
};

// The status a ticket starts in, per type -- matches the plan's workflow
// table: DB Fix/Mass Request go straight to an approval queue, BCP and
// Service Request are auto-assigned (no approval step), Incident Report
// starts "new" pending its spec-010 acknowledge/resolve/close lifecycle.
const INITIAL_STATUS_BY_TYPE: Record<TicketTypeCode, string> = {
  database_fix_request: "pending_approval",
  mass_request: "pending_approval",
  bcp_whitelisting_request: "assigned",
  incident_report: "new",
  service_request: "assigned",
};

async function insertExtensionRow<T extends TicketTypeCode>(
  client: PoolClient,
  ticketId: number,
  type: T,
  details: TicketDetailsFor<T>
): Promise<void> {
  switch (type) {
    case "database_fix_request":
    case "mass_request": {
      const d = details as TicketDetailsFor<"database_fix_request">;
      await client.query(
        `INSERT INTO ticket_db_change_details
           (ticket_id, environment, affected_system, table_name, change_description,
            business_justification, record_count_estimate, requested_completion_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          ticketId,
          d.environment,
          d.affectedSystem,
          d.tableName ?? null,
          d.changeDescription,
          d.businessJustification,
          d.recordCountEstimate ?? null,
          d.requestedCompletionDate ?? null,
        ]
      );
      return;
    }
    case "bcp_whitelisting_request": {
      const d = details as TicketDetailsFor<"bcp_whitelisting_request">;
      await client.query(
        `INSERT INTO ticket_bcp_whitelist_details
           (ticket_id, ip_cidr, url_domain, department, business_reason, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [ticketId, d.ipCidr ?? null, d.urlDomain ?? null, d.department, d.businessReason, d.expiryDate ?? null]
      );
      return;
    }
    case "incident_report": {
      const d = details as TicketDetailsFor<"incident_report">;
      await client.query(
        `INSERT INTO ticket_incident_report_details
           (ticket_id, severity, systems_affected, incident_occurred_at,
            impact_description, immediate_action_taken)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [ticketId, d.severity, d.systemsAffected, d.incidentOccurredAt, d.impactDescription, d.immediateActionTaken ?? null]
      );
      return;
    }
    case "service_request": {
      const d = details as TicketDetailsFor<"service_request">;
      await client.query(
        `INSERT INTO ticket_service_request_details (ticket_id, category, requested_completion_date)
         VALUES ($1, $2, $3)`,
        [ticketId, d.category, d.requestedCompletionDate ?? null]
      );
      return;
    }
  }
}

export async function createTicket<T extends TicketTypeCode>(input: {
  type: T;
  requestorId: number;
  base: BaseTicketInput;
  details: TicketDetailsFor<T>;
}): Promise<{ id: number; ticketNumber: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const typeRow = await client.query(
      "SELECT id, has_approval_step FROM ticket_types WHERE code = $1",
      [input.type]
    );
    if (typeRow.rows.length === 0) {
      throw new Error(`Unknown ticket type: ${input.type}`);
    }
    const ticketTypeId = typeRow.rows[0].id;

    const statusRow = await client.query(
      "SELECT id FROM ticket_statuses WHERE code = $1",
      [INITIAL_STATUS_BY_TYPE[input.type]]
    );
    const statusId = statusRow.rows[0].id;

    // Service Request is the one type where the requestor picks the
    // assignee at creation time (see ticket_types.allows_requestor_choose_assignee).
    const currentAssigneeId =
      input.type === "service_request"
        ? (input.details as TicketDetailsFor<"service_request">).assigneeUserId
        : null;

    // Types with an approval step (Database Fix Request, Mass Request) get
    // their exclusive approver resolved at creation time -- data-driven via
    // workflow_assignments, not a hardcoded name, so this works for any
    // current or future type with has_approval_step=true.
    let approverId: number | null = null;
    if (typeRow.rows[0].has_approval_step) {
      const approverRow = await client.query(
        `SELECT user_id FROM workflow_assignments
          WHERE ticket_type_id = $1 AND workflow_step = 'approver' AND is_exclusive = true
          LIMIT 1`,
        [ticketTypeId]
      );
      approverId = approverRow.rows[0]?.user_id ?? null;
    }

    const ticketResult = await client.query(
      `INSERT INTO tickets (ticket_type_id, status_id, title, description, requestor_id, priority, current_assignee_id, approver_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, ticket_number`,
      [
        ticketTypeId,
        statusId,
        input.base.title,
        input.base.description ?? null,
        input.requestorId,
        input.base.priority,
        currentAssigneeId,
        approverId,
      ]
    );
    const ticket = ticketResult.rows[0];

    await insertExtensionRow(client, ticket.id, input.type, input.details);

    await recordAuditEvent(
      {
        ticketId: ticket.id,
        eventType: "status_change",
        actorUserId: input.requestorId,
        fromValue: null,
        toValue: INITIAL_STATUS_BY_TYPE[input.type],
        note: "Ticket created.",
      },
      client
    );

    // Types with an approval step notify their exclusive approver the
    // moment a ticket lands in their queue (the plan's "new -> pending_approval,
    // notify: exclusive approver"). Writes to the queue only -- actual
    // sending is spec 016's job.
    if (approverId) {
      await client.query(
        `INSERT INTO notification_events (ticket_id, recipient_user_id, event_type, subject, payload)
         VALUES ($1, $2, 'submitted', $3, $4)`,
        [
          ticket.id,
          approverId,
          `New ${input.type.replace(/_/g, " ")} awaiting your approval: ${ticket.ticket_number}`,
          JSON.stringify({ ticketNumber: ticket.ticket_number }),
        ]
      );
    }

    await client.query("COMMIT");
    return { id: ticket.id, ticketNumber: ticket.ticket_number };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Role-scoped per the plan's RBAC table: a plain requestor (no stored role)
 * only sees their own tickets; approver/admin/associate see everything.
 * Finer per-ticket assignee-scoping for associates lands with the workflows
 * that actually assign to them (specs 007-011).
 */
export async function listTicketsForViewer(
  viewerId: number,
  viewerRoles: string[]
): Promise<TicketListRow[]> {
  const isPrivileged = viewerRoles.some((r) =>
    ["approver", "admin", "associate"].includes(r)
  );

  const result = await pool.query(
    `SELECT t.id, t.ticket_number, t.title, tt.code AS type_code, tt.label AS type_label,
            ts.code AS status_code, ts.label AS status_label, t.priority,
            req.name AS requestor_name, asg.name AS assignee_name, t.created_at
       FROM tickets t
       JOIN ticket_types tt ON tt.id = t.ticket_type_id
       JOIN ticket_statuses ts ON ts.id = t.status_id
       JOIN users req ON req.id = t.requestor_id
       LEFT JOIN users asg ON asg.id = t.current_assignee_id
      WHERE $1 OR t.requestor_id = $2
      ORDER BY t.created_at DESC`,
    [isPrivileged, viewerId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    ticketNumber: row.ticket_number,
    title: row.title,
    typeCode: row.type_code,
    typeLabel: row.type_label,
    statusCode: row.status_code,
    statusLabel: row.status_label,
    priority: row.priority,
    requestorName: row.requestor_name,
    assigneeName: row.assignee_name,
    createdAt: row.created_at,
  }));
}

export async function getTicketById(ticketId: number): Promise<TicketDetail | null> {
  const result = await pool.query(
    `SELECT t.id, t.ticket_number, t.title, t.description, tt.code AS type_code, tt.label AS type_label,
            ts.code AS status_code, ts.label AS status_label, t.priority,
            t.requestor_id, req.name AS requestor_name, asg.name AS assignee_name, t.created_at
       FROM tickets t
       JOIN ticket_types tt ON tt.id = t.ticket_type_id
       JOIN ticket_statuses ts ON ts.id = t.status_id
       JOIN users req ON req.id = t.requestor_id
       LEFT JOIN users asg ON asg.id = t.current_assignee_id
      WHERE t.id = $1`,
    [ticketId]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    title: row.title,
    description: row.description,
    typeCode: row.type_code,
    typeLabel: row.type_label,
    statusCode: row.status_code,
    statusLabel: row.status_label,
    priority: row.priority,
    requestorId: row.requestor_id,
    requestorName: row.requestor_name,
    assigneeName: row.assignee_name,
    createdAt: row.created_at,
  };
}
