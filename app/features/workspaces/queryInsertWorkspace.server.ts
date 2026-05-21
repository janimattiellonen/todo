import type { DatabasePool, DatabaseTransactionConnection } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { toWorkspaceId, type WorkspaceId } from "./workspacesTypes";

const row = z.strictObject({ id: z.string().uuid() });

export async function queryInsertWorkspace(
  connection: DatabasePool | DatabaseTransactionConnection,
  name: string,
): Promise<WorkspaceId> {
  const { id } = await connection.one(
    sql.type(row)`
      INSERT INTO workspaces (name) VALUES (${name})
      RETURNING id
    `,
  );

  return toWorkspaceId(id);
}
