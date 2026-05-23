import type { DatabasePool } from "slonik";
import { sql } from "~/database/sql.server";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import type { TaskId } from "./tasksTypes";

/**
 * Delete a task. The WHERE is double-scoped on `(id, workspace_id)` so
 * a task id from another workspace cannot be deleted even if a session
 * supplies one. Returns whether a row was removed.
 */
export async function queryDeleteTask(
  pool: DatabasePool,
  workspaceId: WorkspaceId,
  taskId: TaskId,
): Promise<boolean> {
  const result = await pool.query(
    sql.typeAlias("void")`
      DELETE FROM tasks
       WHERE id           = ${taskId}
         AND workspace_id = ${workspaceId}
    `,
  );
  return result.rowCount === 1;
}
