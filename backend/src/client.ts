// Client-safe entry point ("backend/client"). Anything importable from a
// Client Component must live behind this file, not the main "backend"
// barrel -- that barrel re-exports db/pool.ts, and Next.js's bundler pulls
// a module's *entire* graph into the client bundle for ANY import from it
// (even a type-only one mixed into the same import statement as a value
// import), which drags in `pg` and fails on Node builtins (`net`, `tls`)
// the browser doesn't have. Only export pure, dependency-free modules here
// (zod schemas, plain types) -- never anything that (transitively) imports
// `pg`.
export {
  TICKET_TYPE_CODES,
  baseTicketSchema,
  dbChangeDetailsSchema,
  bcpWhitelistDetailsSchema,
  incidentReportDetailsSchema,
  serviceRequestDetailsSchema,
  TICKET_TYPE_DETAIL_SCHEMAS,
} from "./validation/ticketSchemas";
export type { TicketTypeCode, TicketDetailsFor } from "./validation/ticketSchemas";
export { hasRole, canAccessPage } from "./rbac/can";
export type { RoleCode } from "./rbac/can";
export type { AssignableUser, TicketListRow, TicketDetail, AuditLogRow } from "./types";
