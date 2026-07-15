export type RoleCode = "requestor" | "approver" | "admin" | "associate";

/**
 * `requestor` is never a stored row in `roles` -- it's the implicit floor
 * capability every authenticated user has. Stored roles (from user_roles)
 * are additive on top of it.
 */
export function hasRole(storedRoles: string[], role: RoleCode): boolean {
  if (role === "requestor") return true;
  return storedRoles.includes(role);
}

type Page = "dashboard" | "tickets" | "reports" | "adminUsers" | "adminAudit";

/**
 * Page-level visibility only (spec 004's scope). Per-ticket, per-transition
 * authorization -- the exclusive-assignment-or-delegate check that enforces
 * the Leiva/Rudy restriction -- is deferred to spec 007+, once
 * workflow_assignments has real rows and real ticket actions exist to
 * authorize; building it now against empty tables would be untestable.
 */
const PAGE_ACCESS: Record<Page, RoleCode[]> = {
  dashboard: ["requestor", "approver", "admin", "associate"],
  tickets: ["requestor", "approver", "admin", "associate"],
  reports: ["approver", "admin"],
  adminUsers: ["admin"],
  adminAudit: ["admin"],
};

export function canAccessPage(storedRoles: string[], page: Page): boolean {
  return PAGE_ACCESS[page].some((role) => hasRole(storedRoles, role));
}
