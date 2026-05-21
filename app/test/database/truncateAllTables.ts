import type { DatabasePool } from "slonik";
import { sql } from "~/database/sql.server";

/**
 * Truncate all domain tables to reset state between integration tests.
 *
 * Add new tables here as they land. Do not include `_migrations` — that is
 * the migration tracker, not domain state, and recreating it on every
 * `beforeEach` would defeat globalSetup.
 *
 * Order doesn't matter with `CASCADE`, but listing children before parents
 * makes the dependency graph obvious to humans reading the file.
 */
export async function truncateAllTables(pool: DatabasePool): Promise<void> {
  await pool.query(
    sql.typeAlias("void")`
      TRUNCATE
        sessions,
        magic_link_tokens,
        columns,
        workspace_members,
        workspaces,
        users
      CASCADE
    `,
  );
}
