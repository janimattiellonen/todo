import type { DatabasePool } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { toUserId, type UserId } from "~/features/users/usersTypes";
import type { WorkspaceId } from "./workspacesTypes";

const row = z.strictObject({
  user_id: z.string().uuid(),
  email: z.string(),
});

export type WorkspaceMember = {
  userId: UserId;
  email: string;
};

/**
 * List the members of a workspace, ordered by email for stable display.
 * Used by the assignee dropdown.
 */
export async function queryListWorkspaceMembers(
  pool: DatabasePool,
  workspaceId: WorkspaceId,
): Promise<WorkspaceMember[]> {
  const rows = await pool.any(
    sql.type(row)`
      SELECT m.user_id, u.email
        FROM workspace_members m
        JOIN users u ON u.id = m.user_id
       WHERE m.workspace_id = ${workspaceId}
       ORDER BY u.email ASC
    `,
  );
  return rows.map((r) => ({ userId: toUserId(r.user_id), email: r.email }));
}
