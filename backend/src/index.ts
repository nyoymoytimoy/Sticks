export { pool } from "./db/pool";
export { getUserForLogin } from "./db/queries/users";
export type { AuthenticatedUser } from "./db/queries/users";
export { hashPassword, verifyPassword } from "./auth/password";
export { hasRole, canAccessPage } from "./rbac/can";
export type { RoleCode } from "./rbac/can";
