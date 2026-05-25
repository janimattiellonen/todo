import type { DatabasePool } from "slonik";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import { queryArchiveTask } from "./queryArchiveTask.server";
import type { TaskId } from "./tasksTypes";

export type ArchiveTaskOutcome = { ok: true } | { ok: false; error: string };

/**
 * Archive a task (sets `archived = true`). Workspace-scoped — a task
 * from another workspace matches no row and returns `ok: false`.
 *
 * Idempotent: calling against an already-archived task is a no-op
 * at the data level (the SET sets the same value) and returns `ok: true`.
 */
export async function archiveTask(
  pool: DatabasePool,
  workspaceId: WorkspaceId,
  taskId: TaskId,
): Promise<ArchiveTaskOutcome> {
  const archived = await queryArchiveTask(pool, workspaceId, taskId);
  if (!archived) {
    return { ok: false, error: "Task not found in this workspace." };
  }
  return { ok: true };
}
