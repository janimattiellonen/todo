import type { DatabasePool, DatabaseTransactionConnection } from "slonik";
import { sql } from "~/database/sql.server";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";

type Input = {
  workspaceId: WorkspaceId;
  name: string;
  position: number;
};

export async function queryInsertColumn(
  connection: DatabasePool | DatabaseTransactionConnection,
  input: Input,
): Promise<void> {
  await connection.query(
    sql.typeAlias("void")`
      INSERT INTO columns (workspace_id, name, position)
      VALUES (${input.workspaceId}, ${input.name}, ${input.position})
    `,
  );
}
