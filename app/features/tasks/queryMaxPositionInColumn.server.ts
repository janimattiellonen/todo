import type { DatabasePool, DatabaseTransactionConnection } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import type { ColumnId } from "~/features/columns/columnsTypes";

const row = z.strictObject({ max: z.coerce.number().nullable() });

/**
 * Returns the largest `position` currently in the column, or `null` if
 * the column is empty. Used to compute the next task's position with a
 * sparse step.
 */
export async function queryMaxPositionInColumn(
  connection: DatabasePool | DatabaseTransactionConnection,
  columnId: ColumnId,
): Promise<number | null> {
  const result = await connection.one(
    sql.type(row)`
      SELECT MAX(position) AS max
        FROM tasks
       WHERE column_id = ${columnId}
    `,
  );
  return result.max;
}
