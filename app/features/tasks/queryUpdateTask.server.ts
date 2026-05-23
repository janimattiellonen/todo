import type { DatabasePool, DatabaseTransactionConnection } from "slonik";
import { sql } from "~/database/sql.server";
import type { ColumnId } from "~/features/columns/columnsTypes";
import type { UserId } from "~/features/users/usersTypes";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import type { TaskId } from "./tasksTypes";

type Input = {
  taskId: TaskId;
  workspaceId: WorkspaceId;
  title: string;
  description: string | null;
  columnId: ColumnId;
  assigneeUserId: UserId | null;
  dueDate: string | null;
};

/**
 * Update a task's editable fields. The WHERE clause is double-scoped on
 * `(id, workspace_id)` so a task id from another workspace cannot be
 * updated even if the caller's session is for a different workspace.
 *
 * Returns true if a row was updated, false otherwise.
 */
export async function queryUpdateTask(
  connection: DatabasePool | DatabaseTransactionConnection,
  input: Input,
): Promise<boolean> {
  const result = await connection.query(
    sql.typeAlias("void")`
      UPDATE tasks
         SET title            = ${input.title},
             description      = ${input.description},
             column_id        = ${input.columnId},
             assignee_user_id = ${input.assigneeUserId},
             due_date         = ${input.dueDate},
             updated_at       = now()
       WHERE id           = ${input.taskId}
         AND workspace_id = ${input.workspaceId}
    `,
  );

  return result.rowCount === 1;
}
