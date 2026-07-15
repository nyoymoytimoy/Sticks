export { pool } from "./db/pool";
export { getUserForLogin, getAssignableUsers } from "./db/queries/users";
export type { AuthenticatedUser, AssignableUser } from "./db/queries/users";
export { getRecentAuditEvents, getAuditEventsForTicket } from "./db/queries/audit";
export type { AuditLogRow } from "./db/queries/audit";
export { recordAuditEvent } from "./audit/recordAuditEvent";
export type { AuditEventType, RecordAuditEventInput } from "./audit/recordAuditEvent";
export { hashPassword, verifyPassword } from "./auth/password";
export { hasRole, canAccessPage } from "./rbac/can";
export type { RoleCode } from "./rbac/can";
export { createTicket, listTicketsForViewer, getTicketById } from "./db/queries/tickets";
export type { TicketListRow, TicketDetail } from "./db/queries/tickets";
export {
  TICKET_TYPE_CODES,
  baseTicketSchema,
  dbChangeDetailsSchema,
  bcpWhitelistDetailsSchema,
  incidentReportDetailsSchema,
  serviceRequestDetailsSchema,
  TICKET_TYPE_DETAIL_SCHEMAS,
  stripEmptyStrings,
} from "./validation/ticketSchemas";
export type { TicketTypeCode, TicketDetailsFor } from "./validation/ticketSchemas";
