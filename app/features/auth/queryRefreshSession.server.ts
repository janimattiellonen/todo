import type { DatabasePool } from "slonik";
import { sql } from "~/database/sql.server";
import type { SessionId } from "./sessionTypes";

/**
 * Extend a session's expiry and bump its last_used_at — the sliding
 * window. Called on every authenticated request via `requireSession`.
 */
export async function queryRefreshSession(
  pool: DatabasePool,
  sessionId: SessionId,
  newExpiresAt: Date,
): Promise<void> {
  await pool.query(
    sql.typeAlias("void")`
      UPDATE sessions
         SET last_used_at = now(),
             expires_at   = ${newExpiresAt.toISOString()}
       WHERE id = ${sessionId}
    `,
  );
}
