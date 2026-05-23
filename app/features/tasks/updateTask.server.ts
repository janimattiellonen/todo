import type { DatabasePool } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { toColumnId } from "~/features/columns/columnsTypes";
import { toUserId } from "~/features/users/usersTypes";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import { queryUpdateTask } from "./queryUpdateTask.server";
import { toTaskId } from "./tasksTypes";
import type { UpdateTaskInput } from "./validateUpdateTaskInput";

const idRow = z.strictObject({ id: z.string().uuid() });

export type UpdateTaskOutcome = { ok: true } | { ok: false; error: string };

/**
 * Update a task. Wraps the same defence-in-depth checks as insertTask
 * around a single UPDATE — column belongs to this workspace, optional
 * assignee is a member, and the task itself is in this workspace.
 */
export function updateTask(
  pool: DatabasePool,
  workspaceId: WorkspaceId,
  input: UpdateTaskInput,
): Promise<UpdateTaskOutcome> {
  return pool.transaction(async (connection) => {
    const column = await connection.maybeOne(
      sql.type(idRow)`
        SELECT id FROM columns
         WHERE id = ${input.columnId}
           AND workspace_id = ${workspaceId}
      `,
    );
    if (column === null) {
      return {
        ok: false as const,
        error: "Column not found in this workspace.",
      };
    }

    if (input.assigneeUserId !== null) {
      const member = await connection.maybeOne(
        sql.type(idRow)`
          SELECT user_id AS id FROM workspace_members
           WHERE workspace_id = ${workspaceId}
             AND user_id = ${input.assigneeUserId}
        `,
      );
      if (member === null) {
        return {
          ok: false as const,
          error: "Assignee is not a member of this workspace.",
        };
      }
    }

    const updated = await queryUpdateTask(connection, {
      taskId: toTaskId(input.taskId),
      workspaceId,
      title: input.title,
      description: input.description,
      columnId: toColumnId(input.columnId),
      assigneeUserId:
        input.assigneeUserId === null ? null : toUserId(input.assigneeUserId),
      dueDate: input.dueDate,
    });

    if (!updated) {
      return { ok: false as const, error: "Task not found in this workspace." };
    }

    return { ok: true as const };
  });
}
