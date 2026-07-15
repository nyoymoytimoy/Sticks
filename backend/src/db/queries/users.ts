import { pool } from "../pool";
import type { AssignableUser } from "../../types";

export type { AssignableUser };

export type AuthenticatedUser = {
  id: number;
  name: string | null;
  email: string;
  passwordHash: string | null;
  isActive: boolean;
  roles: string[];
};

/**
 * Looks up a user by email along with their role codes, in one round trip.
 * Used by the Credentials provider's authorize() callback.
 */
export async function getUserForLogin(email: string): Promise<AuthenticatedUser | null> {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.is_active,
            coalesce(array_agg(r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.email = $1
      GROUP BY u.id`,
    [email]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    isActive: row.is_active,
    roles: row.roles,
  };
}

/**
 * Admin/Associate users eligible to be picked as a Service Request's
 * assignee at creation time (the one type where the requestor chooses --
 * see ticket_types.allows_requestor_choose_assignee).
 */
export async function getAssignableUsers(): Promise<AssignableUser[]> {
  const result = await pool.query(
    `SELECT DISTINCT u.id, u.name, u.email
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
      WHERE r.code IN ('admin', 'associate') AND u.is_active
      ORDER BY u.name`
  );
  return result.rows;
}
