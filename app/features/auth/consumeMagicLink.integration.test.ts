import { describe, expect, test } from "vitest";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import {
  completeFirstTimeSetup,
  consumeMagicLink,
} from "~/features/auth/consumeMagicLink.server";
import {
  generateOpaqueToken,
  hashToken,
} from "~/features/auth/hashToken.server";
import { createTestPool } from "~/test/database/createTestPool";

const userRow = z.strictObject({ id: z.string().uuid() });
const countRow = z.strictObject({ count: z.coerce.number() });
const sessionRow = z.strictObject({
  user_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  token_hash: z.string(),
});

async function seedUser(
  pool: Awaited<ReturnType<typeof createTestPool>>,
  email: string,
): Promise<string> {
  const { id } = await pool.one(
    sql.type(userRow)`
      INSERT INTO users (email, name) VALUES (${email}, NULL)
      RETURNING id
    `,
  );
  return id;
}

async function issueToken(
  pool: Awaited<ReturnType<typeof createTestPool>>,
  userId: string,
  expiresAt: Date = new Date(Date.now() + 15 * 60 * 1000),
): Promise<{ plaintext: string; hash: string }> {
  const { plaintext, hash } = generateOpaqueToken();
  await pool.query(
    sql.typeAlias("void")`
      INSERT INTO magic_link_tokens (user_id, token_hash, expires_at)
      VALUES (${userId}, ${hash}, ${expiresAt.toISOString()})
    `,
  );
  return { plaintext, hash };
}

describe("consumeMagicLink", () => {
  test("invalid status for unknown token", async () => {
    const pool = await createTestPool();

    const outcome = await consumeMagicLink(pool, "deadbeef");

    expect(outcome).toEqual({ status: "invalid" });
  });

  test("invalid status for expired token", async () => {
    const pool = await createTestPool();
    const userId = await seedUser(pool, "exp@example.com");
    const { hash } = await issueToken(
      pool,
      userId,
      new Date(Date.now() - 1000),
    );

    const outcome = await consumeMagicLink(pool, hash);

    expect(outcome).toEqual({ status: "invalid" });
  });

  test("invalid status on second consume (token marked used)", async () => {
    const pool = await createTestPool();
    const userId = await seedUser(pool, "twice@example.com");
    // Seed a membership so the first consume returns "signed-in".
    const workspaceId = (
      await pool.one(
        sql.type(z.object({ id: z.string().uuid() }))`
          INSERT INTO workspaces (name) VALUES ('twice ws') RETURNING id
        `,
      )
    ).id;
    await pool.query(
      sql.typeAlias("void")`
        INSERT INTO workspace_members (workspace_id, user_id, role)
        VALUES (${workspaceId}, ${userId}, 'admin')
      `,
    );
    const { hash } = await issueToken(pool, userId);

    const first = await consumeMagicLink(pool, hash);
    const second = await consumeMagicLink(pool, hash);

    expect(first.status).toBe("signed-in");
    expect(second).toEqual({ status: "invalid" });
  });

  test("existing user with workspace → signed-in + session inserted", async () => {
    const pool = await createTestPool();
    const userId = await seedUser(pool, "alice@example.com");
    const workspaceId = (
      await pool.one(
        sql.type(z.object({ id: z.string().uuid() }))`
          INSERT INTO workspaces (name) VALUES ('alice ws') RETURNING id
        `,
      )
    ).id;
    await pool.query(
      sql.typeAlias("void")`
        INSERT INTO workspace_members (workspace_id, user_id, role)
        VALUES (${workspaceId}, ${userId}, 'admin')
      `,
    );
    const { hash } = await issueToken(pool, userId);

    const outcome = await consumeMagicLink(pool, hash);

    expect(outcome.status).toBe("signed-in");
    if (outcome.status !== "signed-in") return;

    // Session row exists with the hashed token, never the plaintext.
    const sessions = await pool.any(
      sql.type(sessionRow)`
        SELECT user_id, workspace_id, token_hash FROM sessions
      `,
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.user_id).toBe(userId);
    expect(sessions[0]?.workspace_id).toBe(workspaceId);
    expect(sessions[0]?.token_hash).toBe(hashToken(outcome.sessionToken));
    expect(sessions[0]?.token_hash).not.toBe(outcome.sessionToken);
  });

  test("existing user with NO workspace → needs-workspace + no session yet", async () => {
    const pool = await createTestPool();
    const userId = await seedUser(pool, "bob@example.com");
    const { hash } = await issueToken(pool, userId);

    const outcome = await consumeMagicLink(pool, hash);

    expect(outcome.status).toBe("needs-workspace");
    if (outcome.status !== "needs-workspace") return;

    expect(outcome.userId).toBe(userId);
    expect(outcome.emailLocalpart).toBe("bob");

    const sessions = await pool.any(
      sql.type(countRow)`SELECT COUNT(*)::int AS count FROM sessions`,
    );
    expect(sessions[0]?.count).toBe(0);
  });
});

describe("completeFirstTimeSetup", () => {
  test("atomically creates workspace + member + columns + session", async () => {
    const pool = await createTestPool();
    const userId = await seedUser(pool, "carol@example.com");

    const { sessionToken } = await completeFirstTimeSetup(pool, {
      userId: userId as never,
      workspaceName: "Carol's workspace",
    });

    const ws = await pool.any(
      sql.type(z.object({ id: z.string().uuid(), name: z.string() }))`
        SELECT id, name FROM workspaces
      `,
    );
    expect(ws).toHaveLength(1);
    expect(ws[0]?.name).toBe("Carol's workspace");

    const members = await pool.any(
      sql.type(
        z.object({
          user_id: z.string().uuid(),
          workspace_id: z.string().uuid(),
          role: z.enum(["admin", "user"]),
        }),
      )`
        SELECT user_id, workspace_id, role FROM workspace_members
      `,
    );
    expect(members).toEqual([
      { user_id: userId, workspace_id: ws[0]?.id, role: "admin" },
    ]);

    const columns = await pool.any(
      sql.type(z.object({ name: z.string(), position: z.number() }))`
        SELECT name, position FROM columns
         WHERE workspace_id = ${ws[0]?.id ?? ""}
         ORDER BY position ASC
      `,
    );
    expect(columns.map((c) => c.name)).toEqual([
      "To do",
      "In progress",
      "Done",
    ]);
    expect(columns.map((c) => c.position)).toEqual([1024, 2048, 3072]);

    const sessions = await pool.any(
      sql.type(z.object({ token_hash: z.string() }))`
        SELECT token_hash FROM sessions
      `,
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.token_hash).toBe(hashToken(sessionToken));
  });

  test("rolls back all inserts if any step fails", async () => {
    const pool = await createTestPool();

    // Use a userId that doesn't exist in users. The workspace insert
    // succeeds; the workspace_member FK on user_id fails; the whole
    // transaction must roll back, leaving no workspace, no columns, no
    // session.
    const ghostUserId = "00000000-0000-0000-0000-000000000000";

    await expect(
      completeFirstTimeSetup(pool, {
        userId: ghostUserId as never,
        workspaceName: "Ghost workspace",
      }),
    ).rejects.toThrow();

    const ws = await pool.any(
      sql.type(countRow)`SELECT COUNT(*)::int AS count FROM workspaces`,
    );
    const cols = await pool.any(
      sql.type(countRow)`SELECT COUNT(*)::int AS count FROM columns`,
    );
    const sessions = await pool.any(
      sql.type(countRow)`SELECT COUNT(*)::int AS count FROM sessions`,
    );
    expect(ws[0]?.count).toBe(0);
    expect(cols[0]?.count).toBe(0);
    expect(sessions[0]?.count).toBe(0);
  });
});
