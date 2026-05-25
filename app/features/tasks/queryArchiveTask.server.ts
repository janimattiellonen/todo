import type { DatabasePool } from "slonik";
import { sql } from "~/database/sql.server";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import type { TaskId } from "./tasksTypes";

/**
 * Set `archived = true` on a task, workspace-scoped. Idempotent: a
 * second call against an already-archived task still matches the row
 * (the SET is a no-op) and returns true.
 *
 * Returns true iff the task exists in this workspace.
 */
export async function queryArchiveTask(
  pool: DatabasePool,
  workspaceId: WorkspaceId,
  taskId: TaskId,
): Promise<boolean> {
  const result = await pool.query(
    sql.typeAlias("void")`
      UPDATE tasks
         SET archived   = true,
             updated_at = now()
       WHERE id           = ${taskId}
         AND workspace_id = ${workspaceId}
    `,
  );
  return result.rowCount === 1;
}
