import type { DatabasePool } from "slonik";
import { sql } from "~/database/sql.server";
import type { UserId } from "~/features/users/usersTypes";

type Input = {
  userId: UserId;
  tokenHash: string;
  expiresAt: Date;
};

export async function queryInsertMagicLinkToken(
  pool: DatabasePool,
  input: Input,
): Promise<void> {
  await pool.query(
    sql.typeAlias("void")`
      INSERT INTO magic_link_tokens (user_id, token_hash, expires_at)
      VALUES (${input.userId}, ${input.tokenHash}, ${input.expiresAt.toISOString()})
    `,
  );
}
