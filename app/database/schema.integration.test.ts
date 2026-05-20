import { describe, expect, test } from "vitest";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { toUserId } from "~/features/users/usersTypes";
import {
  toWorkspaceId,
  type WorkspaceRole,
} from "~/features/workspaces/workspacesTypes";
import { createTestPool } from "~/test/database/createTestPool";

const userRow = z.strictObject({
  id: z.string().uuid(),
  email: z.string(),
  name: z.string().nullable(),
});

const workspaceRow = z.strictObject({
  id: z.string().uuid(),
  name: z.string(),
});

const membershipRow = z.strictObject({
  workspace_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(["admin", "user"]),
});

const countRow = z.strictObject({ count: z.coerce.number() });

describe("auth + workspace schema", () => {
  test("inserts and reads back a user, a workspace, and a membership", async () => {
    const pool = await createTestPool();

    const user = await pool.one(
      sql.type(userRow)`
        INSERT INTO users (email, name)
        VALUES ('alice@example.com', 'Alice')
        RETURNING id, email, name
      `,
    );

    const workspace = await pool.one(
      sql.type(workspaceRow)`
        INSERT INTO workspaces (name)
        VALUES (${"alice's workspace"})
        RETURNING id, name
      `,
    );

    const role: WorkspaceRole = "admin";
    const membership = await pool.one(
      sql.type(membershipRow)`
        INSERT INTO workspace_members (workspace_id, user_id, role)
        VALUES (${workspace.id}, ${user.id}, ${role})
        RETURNING workspace_id, user_id, role
      `,
    );

    expect(user.email).toBe("alice@example.com");
    expect(workspace.name).toBe("alice's workspace");
    expect(membership.role).toBe("admin");

    // Branded-type happy path — these compile only because UserId/WorkspaceId
    // are assignable to `string` (Branded<string, "...">).
    expect(toUserId(user.id)).toBe(user.id);
    expect(toWorkspaceId(workspace.id)).toBe(workspace.id);
  });

  test("rejects an invalid workspace_member role at the DB", async () => {
    const pool = await createTestPool();

    const user = await pool.one(
      sql.type(userRow)`
        INSERT INTO users (email, name)
        VALUES ('bob@example.com', 'Bob')
        RETURNING id, email, name
      `,
    );
    const workspace = await pool.one(
      sql.type(workspaceRow)`
        INSERT INTO workspaces (name)
        VALUES ('bob ws')
        RETURNING id, name
      `,
    );

    await expect(
      pool.query(
        sql.typeAlias("void")`
          INSERT INTO workspace_members (workspace_id, user_id, role)
          VALUES (${workspace.id}, ${user.id}, 'super')
        `,
      ),
    ).rejects.toThrow();
  });

  test("CASCADE: deleting the workspace removes its members", async () => {
    const pool = await createTestPool();

    const user = await pool.one(
      sql.type(userRow)`
        INSERT INTO users (email, name) VALUES ('c@example.com', 'C')
        RETURNING id, email, name
      `,
    );
    const workspace = await pool.one(
      sql.type(workspaceRow)`
        INSERT INTO workspaces (name) VALUES ('c ws') RETURNING id, name
      `,
    );
    await pool.query(
      sql.typeAlias("void")`
        INSERT INTO workspace_members (workspace_id, user_id, role)
        VALUES (${workspace.id}, ${user.id}, 'admin')
      `,
    );

    await pool.query(
      sql.typeAlias("void")`DELETE FROM workspaces WHERE id = ${workspace.id}`,
    );

    const remaining = await pool.one(
      sql.type(countRow)`
        SELECT COUNT(*)::int AS count FROM workspace_members
        WHERE workspace_id = ${workspace.id}
      `,
    );
    expect(remaining.count).toBe(0);

    // User itself is untouched by workspace deletion.
    const userStillThere = await pool.one(
      sql.type(countRow)`
        SELECT COUNT(*)::int AS count FROM users WHERE id = ${user.id}
      `,
    );
    expect(userStillThere.count).toBe(1);
  });

  test("CASCADE: deleting the user removes their magic-link tokens and sessions", async () => {
    const pool = await createTestPool();

    const user = await pool.one(
      sql.type(userRow)`
        INSERT INTO users (email, name) VALUES ('d@example.com', 'D')
        RETURNING id, email, name
      `,
    );
    const workspace = await pool.one(
      sql.type(workspaceRow)`
        INSERT INTO workspaces (name) VALUES ('d ws') RETURNING id, name
      `,
    );
    await pool.query(
      sql.typeAlias("void")`
        INSERT INTO magic_link_tokens (user_id, token_hash, expires_at)
        VALUES (${user.id}, 'hash-d', now() + interval '15 minutes')
      `,
    );
    await pool.query(
      sql.typeAlias("void")`
        INSERT INTO sessions (user_id, workspace_id, token_hash, expires_at)
        VALUES (${user.id}, ${workspace.id}, 'sess-d', now() + interval '7 days')
      `,
    );

    await pool.query(
      sql.typeAlias("void")`DELETE FROM users WHERE id = ${user.id}`,
    );

    const tokens = await pool.one(
      sql.type(countRow)`SELECT COUNT(*)::int AS count FROM magic_link_tokens`,
    );
    const sessions = await pool.one(
      sql.type(countRow)`SELECT COUNT(*)::int AS count FROM sessions`,
    );
    expect(tokens.count).toBe(0);
    expect(sessions.count).toBe(0);
  });
});
