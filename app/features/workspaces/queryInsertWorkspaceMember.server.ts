import type { DatabasePool, DatabaseTransactionConnection } from "slonik";
import { sql } from "~/database/sql.server";
import type { UserId } from "~/features/users/usersTypes";
import type { WorkspaceId, WorkspaceRole } from "./workspacesTypes";

type Input = {
  workspaceId: WorkspaceId;
  userId: UserId;
  role: WorkspaceRole;
};

export async function queryInsertWorkspaceMember(
  connection: DatabasePool | DatabaseTransactionConnection,
  input: Input,
): Promise<void> {
  await connection.query(
    sql.typeAlias("void")`
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES (${input.workspaceId}, ${input.userId}, ${input.role})
    `,
  );
}
