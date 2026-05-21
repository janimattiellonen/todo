import type { DatabasePool } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { toUserId } from "~/features/users/usersTypes";
import {
  toWorkspaceId,
  workspaceRoles,
} from "~/features/workspaces/workspacesTypes";
import type { Session } from "./sessionTypes";
import { toSessionId } from "./sessionTypes";

const row = z.strictObject({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  role: z.enum(workspaceRoles),
});

/**
 * Look up an active session by its token hash. Returns `null` if the
 * session is missing, expired, or belongs to a user whose membership in
 * the workspace has been revoked.
 *
 * Joins on `workspace_members` so a session for a since-removed user is
 * treated as missing (session invalidation by membership removal is a
 * defence in depth — sessions also CASCADE on user delete via the FK).
 */
export async function queryFindSession(
  pool: DatabasePool,
  tokenHash: string,
): Promise<Session | null> {
  const found = await pool.maybeOne(
    sql.type(row)`
      SELECT s.id, s.user_id, s.workspace_id, m.role
        FROM sessions s
        JOIN workspace_members m
          ON m.workspace_id = s.workspace_id
         AND m.user_id      = s.user_id
       WHERE s.token_hash = ${tokenHash}
         AND s.expires_at > now()
    `,
  );

  return found === null
    ? null
    : {
        sessionId: toSessionId(found.id),
        userId: toUserId(found.user_id),
        workspaceId: toWorkspaceId(found.workspace_id),
        role: found.role,
      };
}
