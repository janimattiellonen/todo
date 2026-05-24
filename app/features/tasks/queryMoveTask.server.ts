import type { DatabasePool, DatabaseTransactionConnection } from "slonik";
import { sql } from "~/database/sql.server";
import type { ColumnId } from "~/features/columns/columnsTypes";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import type { TaskId } from "./tasksTypes";

type Input = {
  taskId: TaskId;
  workspaceId: WorkspaceId;
  columnId: ColumnId;
  position: number;
};

/**
 * Move a task to a column at the given position. The WHERE clause is
 * double-scoped on (id, workspace_id) so a task id from another
 * workspace cannot be moved. Returns whether a row was matched.
 */
export async function queryMoveTask(
  connection: DatabasePool | DatabaseTransactionConnection,
  input: Input,
): Promise<boolean> {
  const result = await connection.query(
    sql.typeAlias("void")`
      UPDATE tasks
         SET column_id  = ${input.columnId},
             position   = ${input.position},
             updated_at = now()
       WHERE id           = ${input.taskId}
         AND workspace_id = ${input.workspaceId}
    `,
  );
  return result.rowCount === 1;
}
