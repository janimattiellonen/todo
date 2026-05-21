import type { DatabasePool } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import type { WorkspaceId } from "./workspacesTypes";

const row = z.strictObject({
  name: z.string(),
});

export type FoundWorkspace = {
  name: string;
};

export async function queryFindWorkspaceById(
  pool: DatabasePool,
  workspaceId: WorkspaceId,
): Promise<FoundWorkspace | null> {
  const found = await pool.maybeOne(
    sql.type(row)`SELECT name FROM workspaces WHERE id = ${workspaceId}`,
  );

  return found === null ? null : { name: found.name };
}
