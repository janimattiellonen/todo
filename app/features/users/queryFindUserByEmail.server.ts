import type { DatabasePool } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { toUserId, type UserId } from "~/features/users/usersTypes";

const userRow = z.strictObject({
  id: z.string().uuid(),
  email: z.string(),
});

export type FoundUser = {
  id: UserId;
  email: string;
};

export async function queryFindUserByEmail(
  pool: DatabasePool,
  email: string,
): Promise<FoundUser | null> {
  const row = await pool.maybeOne(
    sql.type(userRow)`
      SELECT id, email FROM users WHERE email = ${email}
    `,
  );

  return row === null ? null : { id: toUserId(row.id), email: row.email };
}
