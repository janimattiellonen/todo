import type { DatabasePool, DatabaseTransactionConnection } from "slonik";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { DEFAULT_COLUMNS } from "~/features/columns/columnsTypes";
import { queryInsertColumn } from "~/features/columns/queryInsertColumn.server";
import type { UserId } from "~/features/users/usersTypes";
import { queryFindUserMembership } from "~/features/workspaces/queryFindUserMembership.server";
import { queryInsertWorkspace } from "~/features/workspaces/queryInsertWorkspace.server";
import { queryInsertWorkspaceMember } from "~/features/workspaces/queryInsertWorkspaceMember.server";
import type { WorkspaceId } from "~/features/workspaces/workspacesTypes";
import { generateOpaqueToken } from "./hashToken.server";
import { queryConsumeMagicLinkToken } from "./queryConsumeMagicLinkToken.server";
import { queryInsertSession } from "./queryInsertSession.server";
import { SESSION_MAX_AGE_S } from "./sessionCookie.server";

export type ConsumeOutcome =
  | { status: "signed-in"; sessionToken: string }
  | { status: "needs-workspace"; userId: UserId; emailLocalpart: string }
  | { status: "invalid" };

const userEmailRow = z.strictObject({ email: z.string() });

/**
 * Consume a magic-link token.
 *
 * Three terminal outcomes:
 *   "signed-in"        existing user, has a workspace → session issued
 *   "needs-workspace"  existing user, no workspace yet → prompt for name
 *   "invalid"          token unknown / expired / already consumed
 *
 * The token is marked consumed first (atomic, single statement). If
 * consume succeeds and the user has a membership, a session is created
 * in the same call. If not, the caller must redirect to the workspace-
 * setup page, which finishes the signup transactionally via
 * `completeFirstTimeSetup`.
 */
export async function consumeMagicLink(
  pool: DatabasePool,
  tokenHash: string,
): Promise<ConsumeOutcome> {
  const consumed = await queryConsumeMagicLinkToken(pool, tokenHash);
  if (consumed === null) {
    return { status: "invalid" };
  }

  const membership = await queryFindUserMembership(pool, consumed.userId);

  if (membership !== null) {
    const sessionToken = await issueSession(pool, {
      userId: consumed.userId,
      workspaceId: membership.workspaceId,
    });
    return { status: "signed-in", sessionToken };
  }

  // No workspace yet — fetch the email so we can suggest a default name
  // on the setup page.
  const user = await pool.one(
    sql.type(userEmailRow)`
      SELECT email FROM users WHERE id = ${consumed.userId}
    `,
  );

  return {
    status: "needs-workspace",
    userId: consumed.userId,
    emailLocalpart: localpart(user.email),
  };
}

/**
 * Atomically finish first-time signup: create workspace + admin member
 * + default columns + session. Rolls back as a whole on any failure.
 */
export function completeFirstTimeSetup(
  pool: DatabasePool,
  input: { userId: UserId; workspaceName: string },
): Promise<{ sessionToken: string }> {
  return pool.transaction(async (connection) => {
    const workspaceId = await queryInsertWorkspace(
      connection,
      input.workspaceName,
    );

    await queryInsertWorkspaceMember(connection, {
      workspaceId,
      userId: input.userId,
      role: "admin",
    });

    for (const column of DEFAULT_COLUMNS) {
      await queryInsertColumn(connection, {
        workspaceId,
        name: column.name,
        position: column.position,
      });
    }

    const sessionToken = await issueSessionVia(connection, {
      userId: input.userId,
      workspaceId,
    });

    return { sessionToken };
  });
}

function issueSession(
  pool: DatabasePool,
  input: { userId: UserId; workspaceId: WorkspaceId },
): Promise<string> {
  return issueSessionVia(pool, input);
}

async function issueSessionVia(
  connection: DatabasePool | DatabaseTransactionConnection,
  input: { userId: UserId; workspaceId: WorkspaceId },
): Promise<string> {
  const { plaintext, hash } = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_S * 1000);

  await queryInsertSession(connection, {
    userId: input.userId,
    workspaceId: input.workspaceId,
    tokenHash: hash,
    expiresAt,
  });

  return plaintext;
}

function localpart(email: string): string {
  const at = email.indexOf("@");
  return at === -1 ? email : email.slice(0, at);
}
