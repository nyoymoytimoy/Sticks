import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __stickPgPool: Pool | undefined;
}

/**
 * A single pooled connection shared across the process. Next.js dev mode
 * hot-reloads modules, which would otherwise create a new Pool (and leak
 * connections) on every edit; stashing it on `global` survives reloads.
 */
export const pool =
  global.__stickPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  global.__stickPgPool = pool;
}
