import type { DatabasePool } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { type ColumnId, toColumnId } from "~/features/columns/columnsTypes";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import { computeNewPosition } from "./computeNewPosition";
import { queryMoveTask } from "./queryMoveTask.server";
import { type TaskId, toTaskId } from "./tasksTypes";

const idRow = z.strictObject({ id: z.string().uuid() });
const posRow = z.strictObject({ position: z.coerce.number() });

export type MoveTaskOutcome = { ok: true } | { ok: false; error: string };

type Input = {
  taskId: TaskId;
  destinationColumnId: ColumnId;
  /** Zero-based index in the destination column AFTER the task is removed from its old slot. */
  destinationIndex: number;
};

/**
 * Move a task to a destination column at a given index. Done in a
 * transaction so the position computed from the current state of the
 * destination column is consistent with the eventual UPDATE.
 *
 * Defence in depth:
 *   - target task must belong to the caller's workspace
 *   - destination column must belong to the caller's workspace
 */
export function moveTask(
  pool: DatabasePool,
  workspaceId: WorkspaceId,
  input: Input,
): Promise<MoveTaskOutcome> {
  return pool.transaction(async (connection) => {
    // 1. Confirm the task belongs to this workspace.
    const task = await connection.maybeOne(
      sql.type(idRow)`
        SELECT id FROM tasks
         WHERE id           = ${input.taskId}
           AND workspace_id = ${workspaceId}
      `,
    );
    if (task === null) {
      return { ok: false as const, error: "Task not found in this workspace." };
    }

    // 2. Confirm the destination column belongs to this workspace.
    const column = await connection.maybeOne(
      sql.type(idRow)`
        SELECT id FROM columns
         WHERE id           = ${input.destinationColumnId}
           AND workspace_id = ${workspaceId}
      `,
    );
    if (column === null) {
      return {
        ok: false as const,
        error: "Column not found in this workspace.",
      };
    }

    // 3. Read the destination column's current positions, EXCLUDING the
    // moving task. This makes index handling identical whether the move
    // is cross-column or within the same column.
    const neighbours = await connection.any(
      sql.type(posRow)`
        SELECT position
          FROM tasks
         WHERE column_id   = ${input.destinationColumnId}
           AND archived    = false
           AND id         <> ${input.taskId}
         ORDER BY position ASC
      `,
    );

    const newPosition = computeNewPosition(
      neighbours.map((n) => n.position),
      input.destinationIndex,
    );

    const updated = await queryMoveTask(connection, {
      taskId: toTaskId(input.taskId),
      workspaceId,
      columnId: toColumnId(input.destinationColumnId),
      position: newPosition,
    });
    if (!updated) {
      return { ok: false as const, error: "Task not found in this workspace." };
    }

    return { ok: true as const };
  });
}
