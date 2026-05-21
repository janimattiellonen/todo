import type { DatabasePool } from "slonik";
import { sql } from "~/database/sql.server";

/** Delete a session by its plaintext-cookie hash. Used by sign-out. */
export async function queryDeleteSession(
  pool: DatabasePool,
  tokenHash: string,
): Promise<void> {
  await pool.query(
    sql.typeAlias("void")`
      DELETE FROM sessions WHERE token_hash = ${tokenHash}
    `,
  );
}
