import type { DatabasePool } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import { type ColumnId, toColumnId } from "./columnsTypes";

const row = z.strictObject({
  id: z.string().uuid(),
  name: z.string(),
  position: z.number(),
});

export type WorkspaceColumn = {
  id: ColumnId;
  name: string;
  position: number;
};

/**
 * List the columns in a workspace, ordered by position.
 *
 * The query is workspace-scoped — a session for workspace A can never
 * read workspace B's columns. Enforced both by the WHERE clause and by
 * the integration test (`queryListColumnsForWorkspace.integration.test.ts`).
 */
export async function queryListColumnsForWorkspace(
  pool: DatabasePool,
  workspaceId: WorkspaceId,
): Promise<WorkspaceColumn[]> {
  const rows = await pool.any(
    sql.type(row)`
      SELECT id, name, position
        FROM columns
       WHERE workspace_id = ${workspaceId}
       ORDER BY position ASC
    `,
  );

  return rows.map((r) => ({
    id: toColumnId(r.id),
    name: r.name,
    position: r.position,
  }));
}
