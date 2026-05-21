import { describe, expect, test } from "vitest";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { insertTask } from "~/features/tasks/insertTask.server";
import { toWorkspaceId } from "~/features/workspaces/workspacesTypes";
import { createTestPool } from "~/test/database/createTestPool";

const idRow = z.strictObject({ id: z.string().uuid() });

async function seedWorkspaceWithColumn(name: string) {
  const pool = await createTestPool();
  const ws = await pool.one(
    sql.type(
      idRow,
    )`INSERT INTO workspaces (name) VALUES (${name}) RETURNING id`,
  );
  const col = await pool.one(
    sql.type(idRow)`
      INSERT INTO columns (workspace_id, name, position)
      VALUES (${ws.id}, 'To do', 1024)
      RETURNING id
    `,
  );
  return { workspaceId: ws.id, columnId: col.id, pool };
}

async function seedUser(email: string): Promise<string> {
  const pool = await createTestPool();
  const u = await pool.one(
    sql.type(idRow)`INSERT INTO users (email) VALUES (${email}) RETURNING id`,
  );
  return u.id;
}

describe("insertTask", () => {
  test("inserts at position = 1024 when the column is empty", async () => {
    const ws = await seedWorkspaceWithColumn("w");

    const outcome = await insertTask(ws.pool, toWorkspaceId(ws.workspaceId), {
      columnId: ws.columnId,
      title: "First",
      description: null,
      assigneeUserId: null,
      dueDate: null,
    });

    expect(outcome.ok).toBe(true);
    const tasks = await ws.pool.any(
      sql.type(z.object({ title: z.string(), position: z.coerce.number() }))`
        SELECT title, position FROM tasks WHERE column_id = ${ws.columnId}
      `,
    );
    expect(tasks).toEqual([{ title: "First", position: 1024 }]);
  });

  test("subsequent inserts use max(position) + 1024", async () => {
    const ws = await seedWorkspaceWithColumn("w");
    const wsId = toWorkspaceId(ws.workspaceId);

    for (const title of ["A", "B", "C"]) {
      await insertTask(ws.pool, wsId, {
        columnId: ws.columnId,
        title,
        description: null,
        assigneeUserId: null,
        dueDate: null,
      });
    }

    const tasks = await ws.pool.any(
      sql.type(z.object({ title: z.string(), position: z.coerce.number() }))`
        SELECT title, position FROM tasks
         WHERE column_id = ${ws.columnId}
         ORDER BY position ASC
      `,
    );
    expect(tasks.map((t) => t.position)).toEqual([1024, 2048, 3072]);
    expect(tasks.map((t) => t.title)).toEqual(["A", "B", "C"]);
  });

  test("rejects when the column belongs to a different workspace", async () => {
    const a = await seedWorkspaceWithColumn("ws A");
    const b = await seedWorkspaceWithColumn("ws B");

    const outcome = await insertTask(a.pool, toWorkspaceId(a.workspaceId), {
      columnId: b.columnId,
      title: "Cross-tenant attempt",
      description: null,
      assigneeUserId: null,
      dueDate: null,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toMatch(/column not found/i);

    const tasks = await a.pool.any(
      sql.type(z.object({ count: z.coerce.number() }))`
        SELECT COUNT(*)::int AS count FROM tasks
      `,
    );
    expect(tasks[0]?.count).toBe(0);
  });

  test("rejects when the assignee is not a member of the workspace", async () => {
    const ws = await seedWorkspaceWithColumn("w");
    const outsiderId = await seedUser("outsider@example.com");

    const outcome = await insertTask(ws.pool, toWorkspaceId(ws.workspaceId), {
      columnId: ws.columnId,
      title: "x",
      description: null,
      assigneeUserId: outsiderId,
      dueDate: null,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toMatch(/assignee/i);
  });

  test("accepts a valid assignee who is a workspace member", async () => {
    const ws = await seedWorkspaceWithColumn("w");
    const memberId = await seedUser("m@example.com");
    await ws.pool.query(
      sql.typeAlias("void")`
        INSERT INTO workspace_members (workspace_id, user_id, role)
        VALUES (${ws.workspaceId}, ${memberId}, 'admin')
      `,
    );

    const outcome = await insertTask(ws.pool, toWorkspaceId(ws.workspaceId), {
      columnId: ws.columnId,
      title: "assigned",
      description: null,
      assigneeUserId: memberId,
      dueDate: null,
    });

    expect(outcome.ok).toBe(true);
    const row = await ws.pool.one(
      sql.type(z.object({ assignee_user_id: z.string().uuid().nullable() }))`
        SELECT assignee_user_id FROM tasks LIMIT 1
      `,
    );
    expect(row.assignee_user_id).toBe(memberId);
  });

  test("description / due_date round-trip via the orchestrator", async () => {
    const ws = await seedWorkspaceWithColumn("w");

    const outcome = await insertTask(ws.pool, toWorkspaceId(ws.workspaceId), {
      columnId: ws.columnId,
      title: "Full",
      description: "Detailed body",
      assigneeUserId: null,
      dueDate: "2026-06-15",
    });

    expect(outcome.ok).toBe(true);
    const row = await ws.pool.one(
      sql.type(
        z.object({
          description: z.string().nullable(),
          due_date: z.string().nullable(),
        }),
      )`
        SELECT description, due_date FROM tasks LIMIT 1
      `,
    );
    expect(row.description).toBe("Detailed body");
    expect(row.due_date).toBe("2026-06-15");
  });
});
