import type { DatabasePool, DatabaseTransactionConnection } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import type { UserId } from "~/features/users/usersTypes";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import { type SessionId, toSessionId } from "./sessionTypes";

const row = z.strictObject({ id: z.string().uuid() });

type Input = {
  userId: UserId;
  workspaceId: WorkspaceId;
  tokenHash: string;
  expiresAt: Date;
};

export async function queryInsertSession(
  connection: DatabasePool | DatabaseTransactionConnection,
  input: Input,
): Promise<SessionId> {
  const { id } = await connection.one(
    sql.type(row)`
      INSERT INTO sessions (user_id, workspace_id, token_hash, expires_at)
      VALUES (${input.userId}, ${input.workspaceId}, ${input.tokenHash},
              ${input.expiresAt.toISOString()})
      RETURNING id
    `,
  );

  return toSessionId(id);
}
