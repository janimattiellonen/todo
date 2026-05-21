import type { DatabasePool } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { type ColumnId, toColumnId } from "~/features/columns/columnsTypes";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import { type TaskId, toTaskId } from "./tasksTypes";

const row = z.strictObject({
  id: z.string().uuid(),
  column_id: z.string().uuid(),
  title: z.string(),
  position: z.coerce.number(),
});

export type WorkspaceTask = {
  id: TaskId;
  columnId: ColumnId;
  title: string;
  position: number;
};

/**
 * List non-archived tasks in the workspace, ordered by (column_id,
 * position) ASC. The WHERE clause is workspace-scoped — a session for
 * workspace A can never read workspace B's tasks.
 *
 * Returns only the fields the board page needs (explicit field
 * selection per `project-conventions`).
 */
export async function queryListTasksForWorkspace(
  pool: DatabasePool,
  workspaceId: WorkspaceId,
): Promise<WorkspaceTask[]> {
  const rows = await pool.any(
    sql.type(row)`
      SELECT id, column_id, title, position
        FROM tasks
       WHERE workspace_id = ${workspaceId}
         AND archived     = false
       ORDER BY column_id ASC, position ASC
    `,
  );

  return rows.map((r) => ({
    id: toTaskId(r.id),
    columnId: toColumnId(r.column_id),
    title: r.title,
    position: r.position,
  }));
}
