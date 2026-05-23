import type { DatabasePool, DatabaseTransactionConnection } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { type ColumnId, toColumnId } from "~/features/columns/columnsTypes";
import { toUserId, type UserId } from "~/features/users/usersTypes";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import { type TaskId, toTaskId } from "./tasksTypes";

const row = z.strictObject({
  id: z.string().uuid(),
  column_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  assignee_user_id: z.string().uuid().nullable(),
  due_date: z.string().nullable(),
});

export type EditableTask = {
  id: TaskId;
  columnId: ColumnId;
  title: string;
  description: string | null;
  assigneeUserId: UserId | null;
  dueDate: string | null;
};

/**
 * Look up a task by id, scoped to a workspace. Returns null if the task
 * does not exist or belongs to a different workspace — the workspace_id
 * predicate is the cross-tenant defence.
 */
export async function queryFindTaskById(
  connection: DatabasePool | DatabaseTransactionConnection,
  workspaceId: WorkspaceId,
  taskId: TaskId,
): Promise<EditableTask | null> {
  const found = await connection.maybeOne(
    sql.type(row)`
      SELECT id, column_id, title, description,
             assignee_user_id, due_date
        FROM tasks
       WHERE id           = ${taskId}
         AND workspace_id = ${workspaceId}
    `,
  );

  if (found === null) return null;

  return {
    id: toTaskId(found.id),
    columnId: toColumnId(found.column_id),
    title: found.title,
    description: found.description,
    assigneeUserId:
      found.assignee_user_id === null ? null : toUserId(found.assignee_user_id),
    dueDate: found.due_date,
  };
}
