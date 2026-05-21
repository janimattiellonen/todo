import type { DatabasePool, DatabaseTransactionConnection } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import type { UserId } from "~/features/users/usersTypes";
import {
  toWorkspaceId,
  type WorkspaceId,
  type WorkspaceRole,
  workspaceRoles,
} from "./workspacesTypes";

const row = z.strictObject({
  workspace_id: z.string().uuid(),
  role: z.enum(workspaceRoles),
});

export type UserMembership = {
  workspaceId: WorkspaceId;
  role: WorkspaceRole;
};

/**
 * Look up the user's workspace membership. In MVP every user belongs to
 * exactly one workspace; this returns the first one found (ordered by
 * `joined_at` for stability if that ever changes).
 */
export async function queryFindUserMembership(
  connection: DatabasePool | DatabaseTransactionConnection,
  userId: UserId,
): Promise<UserMembership | null> {
  const found = await connection.maybeOne(
    sql.type(row)`
      SELECT workspace_id, role
        FROM workspace_members
       WHERE user_id = ${userId}
       ORDER BY joined_at ASC
       LIMIT 1
    `,
  );

  return found === null
    ? null
    : { workspaceId: toWorkspaceId(found.workspace_id), role: found.role };
}
