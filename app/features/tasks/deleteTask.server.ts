import type { DatabasePool } from "slonik";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import { queryDeleteTask } from "./queryDeleteTask.server";
import type { TaskId } from "./tasksTypes";

export type DeleteTaskOutcome = { ok: true } | { ok: false; error: string };

/**
 * Hard-delete a task. Workspace-scoped so a task id from another
 * workspace cannot be deleted. Returns a discriminated outcome.
 *
 * Adjacent tasks in the same column are intentionally not renumbered —
 * positions stay sparse, which is the expected steady-state.
 */
export async function deleteTask(
  pool: DatabasePool,
  workspaceId: WorkspaceId,
  taskId: TaskId,
): Promise<DeleteTaskOutcome> {
  const deleted = await queryDeleteTask(pool, workspaceId, taskId);
  if (!deleted) {
    return { ok: false, error: "Task not found in this workspace." };
  }
  return { ok: true };
}
