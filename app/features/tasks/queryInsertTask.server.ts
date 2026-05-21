import type { DatabasePool, DatabaseTransactionConnection } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import type { ColumnId } from "~/features/columns/columnsTypes";
import type { UserId } from "~/features/users/usersTypes";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import { type TaskId, toTaskId } from "./tasksTypes";

const row = z.strictObject({ id: z.string().uuid() });

type Input = {
  workspaceId: WorkspaceId;
  columnId: ColumnId;
  title: string;
  description: string | null;
  assigneeUserId: UserId | null;
  dueDate: string | null;
  position: number;
};

export async function queryInsertTask(
  connection: DatabasePool | DatabaseTransactionConnection,
  input: Input,
): Promise<TaskId> {
  const { id } = await connection.one(
    sql.type(row)`
      INSERT INTO tasks (
        workspace_id, column_id, title, description,
        assignee_user_id, due_date, position
      )
      VALUES (
        ${input.workspaceId}, ${input.columnId}, ${input.title},
        ${input.description}, ${input.assigneeUserId},
        ${input.dueDate}, ${input.position}
      )
      RETURNING id
    `,
  );
  return toTaskId(id);
}
