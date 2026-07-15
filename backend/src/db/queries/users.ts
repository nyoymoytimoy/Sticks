import { pool } from "../pool";

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
