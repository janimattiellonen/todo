import type { DatabasePool } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { toColumnId } from "~/features/columns/columnsTypes";
import { toUserId } from "~/features/users/usersTypes";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import { queryInsertTask } from "./queryInsertTask.server";
import { queryMaxPositionInColumn } from "./queryMaxPositionInColumn.server";
import type { NewTaskInput } from "./validateNewTaskInput";

const POSITION_STEP = 1024;

export type InsertTaskOutcome =
  | { ok: true; taskId: string }
  | { ok: false; error: string };

const idRow = z.strictObject({ id: z.string().uuid() });

/**
 * Insert a new task at the bottom of the target column.
 *
 * Defence-in-depth checks (in a transaction):
 *   1. The target column belongs to the caller's workspace.
 *   2. If an assignee is supplied, they are a member of that workspace.
 *   3. position is computed as max(position) + 1024 inside the same
 *      transaction so concurrent inserts cannot collide on the same
 *      position.
 *
 * Any failure rolls the whole thing back and returns `{ ok: false }`.
 */
export function insertTask(
  pool: DatabasePool,
  workspaceId: WorkspaceId,
  input: NewTaskInput,
): Promise<InsertTaskOutcome> {
  return pool.transaction(async (connection) => {
    // 1. Column belongs to this workspace?
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

    // 2. Assignee is a member of this workspace?
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

    // 3. Compute position = max + 1024.
    const max = await queryMaxPositionInColumn(
      connection,
      toColumnId(input.columnId),
    );
    const position = max === null ? POSITION_STEP : max + POSITION_STEP;

    const taskId = await queryInsertTask(connection, {
      workspaceId,
      columnId: toColumnId(input.columnId),
      title: input.title,
      description: input.description,
      assigneeUserId:
        input.assigneeUserId === null ? null : toUserId(input.assigneeUserId),
      dueDate: input.dueDate,
      position,
    });

    return { ok: true as const, taskId };
  });
}
