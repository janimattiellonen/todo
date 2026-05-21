import { describe, expect, test } from "vitest";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { createTestPool } from "~/test/database/createTestPool";

const idRow = z.strictObject({ id: z.string().uuid() });
const countRow = z.strictObject({ count: z.coerce.number() });
const taskRow = z.strictObject({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  column_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  assignee_user_id: z.string().uuid().nullable(),
  due_date: z.string().nullable(),
  archived: z.boolean(),
  position: z.coerce.number(),
});

async function seedWorkspaceWithColumn(): Promise<{
  workspaceId: string;
  columnId: string;
}> {
  const pool = await createTestPool();
  const ws = await pool.one(
    sql.type(idRow)`INSERT INTO workspaces (name) VALUES ('ws') RETURNING id`,
  );
  const col = await pool.one(
    sql.type(idRow)`
      INSERT INTO columns (workspace_id, name, position)
      VALUES (${ws.id}, 'To do', 1024)
      RETURNING id
    `,
  );
  return { workspaceId: ws.id, columnId: col.id };
}

describe("tasks schema", () => {
  test("inserts and reads back a task via Slonik + Zod row validation", async () => {
    const pool = await createTestPool();
    const { workspaceId, columnId } = await seedWorkspaceWithColumn();
    const user = await pool.one(
      sql.type(
        idRow,
      )`INSERT INTO users (email) VALUES ('a@example.com') RETURNING id`,
    );

    const inserted = await pool.one(
      sql.type(taskRow)`
        INSERT INTO tasks (
          workspace_id, column_id, title, description,
          assignee_user_id, due_date, position
        )
        VALUES (
          ${workspaceId}, ${columnId}, 'Write spec', 'first draft',
          ${user.id}, '2026-06-01', 1024.5
        )
        RETURNING id, workspace_id, column_id, title, description,
                  assignee_user_id, due_date, archived, position
      `,
    );

    expect(inserted.title).toBe("Write spec");
    expect(inserted.description).toBe("first draft");
    expect(inserted.assignee_user_id).toBe(user.id);
    expect(inserted.due_date).toBe("2026-06-01");
    expect(inserted.archived).toBe(false);
    expect(inserted.position).toBe(1024.5);
  });

  test("CASCADE: deleting the workspace deletes its tasks", async () => {
    const pool = await createTestPool();
    const { workspaceId, columnId } = await seedWorkspaceWithColumn();

    await pool.query(
      sql.typeAlias("void")`
        INSERT INTO tasks (workspace_id, column_id, title, position)
        VALUES (${workspaceId}, ${columnId}, 't1', 1)
      `,
    );

    await pool.query(
      sql.typeAlias("void")`DELETE FROM workspaces WHERE id = ${workspaceId}`,
    );

    const remaining = await pool.one(
      sql.type(countRow)`SELECT COUNT(*)::int AS count FROM tasks`,
    );
    expect(remaining.count).toBe(0);
  });

  test("SET NULL: deleting the assignee user nulls assignee_user_id", async () => {
    const pool = await createTestPool();
    const { workspaceId, columnId } = await seedWorkspaceWithColumn();
    const user = await pool.one(
      sql.type(
        idRow,
      )`INSERT INTO users (email) VALUES ('b@example.com') RETURNING id`,
    );

    await pool.query(
      sql.typeAlias("void")`
        INSERT INTO tasks (workspace_id, column_id, title, assignee_user_id, position)
        VALUES (${workspaceId}, ${columnId}, 't2', ${user.id}, 1)
      `,
    );

    await pool.query(
      sql.typeAlias("void")`DELETE FROM users WHERE id = ${user.id}`,
    );

    const after = await pool.one(
      sql.type(z.object({ assignee_user_id: z.string().uuid().nullable() }))`
        SELECT assignee_user_id FROM tasks LIMIT 1
      `,
    );
    expect(after.assignee_user_id).toBeNull();
  });

  test("RESTRICT: deleting a column that has tasks is forbidden", async () => {
    const pool = await createTestPool();
    const { workspaceId, columnId } = await seedWorkspaceWithColumn();

    await pool.query(
      sql.typeAlias("void")`
        INSERT INTO tasks (workspace_id, column_id, title, position)
        VALUES (${workspaceId}, ${columnId}, 't3', 1)
      `,
    );

    await expect(
      pool.query(
        sql.typeAlias("void")`DELETE FROM columns WHERE id = ${columnId}`,
      ),
    ).rejects.toThrow();

    // Empty column → delete allowed.
    const emptyCol = await pool.one(
      sql.type(idRow)`
        INSERT INTO columns (workspace_id, name, position)
        VALUES (${workspaceId}, 'Empty', 2048)
        RETURNING id
      `,
    );
    await pool.query(
      sql.typeAlias("void")`DELETE FROM columns WHERE id = ${emptyCol.id}`,
    );
  });

  test("archived defaults to false", async () => {
    const pool = await createTestPool();
    const { workspaceId, columnId } = await seedWorkspaceWithColumn();

    const inserted = await pool.one(
      sql.type(z.object({ archived: z.boolean() }))`
        INSERT INTO tasks (workspace_id, column_id, title, position)
        VALUES (${workspaceId}, ${columnId}, 't4', 1)
        RETURNING archived
      `,
    );

    expect(inserted.archived).toBe(false);
  });
});
