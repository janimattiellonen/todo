import type { DatabasePool, DatabaseTransactionConnection } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { toUserId, type UserId } from "~/features/users/usersTypes";

const row = z.strictObject({ user_id: z.string().uuid() });

/**
 * Atomically mark a magic-link token as consumed and return the user.
 *
 * Updates the row in a single statement so that even concurrent calls
 * can only succeed once. Returns `null` if the token does not exist,
 * has already been consumed, or has expired — callers must not
 * distinguish these cases (no enumeration leak).
 */
export async function queryConsumeMagicLinkToken(
  connection: DatabasePool | DatabaseTransactionConnection,
  tokenHash: string,
): Promise<{ userId: UserId } | null> {
  const found = await connection.maybeOne(
    sql.type(row)`
      UPDATE magic_link_tokens
         SET consumed_at = now()
       WHERE token_hash  = ${tokenHash}
         AND consumed_at IS NULL
         AND expires_at  > now()
       RETURNING user_id
    `,
  );

  return found === null ? null : { userId: toUserId(found.user_id) };
}
