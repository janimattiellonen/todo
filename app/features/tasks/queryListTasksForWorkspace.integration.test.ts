import { describe, expect, test } from "vitest";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { queryListTasksForWorkspace } from "~/features/tasks/queryListTasksForWorkspace.server";
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

// biome-ignore lint/security/noSecrets: Describe label, not a secret.
describe("queryListTasksForWorkspace", () => {
  test("workspace isolation: a query for workspace A returns only workspace A's tasks", async () => {
    const a = await seedWorkspaceWithColumn("ws A");
    const b = await seedWorkspaceWithColumn("ws B");

    await a.pool.query(
      sql.typeAlias("void")`
        INSERT INTO tasks (workspace_id, column_id, title, position)
        VALUES (${a.workspaceId}, ${a.columnId}, 'A-task-1', 100),
               (${a.workspaceId}, ${a.columnId}, 'A-task-2', 200)
      `,
    );
    await b.pool.query(
      sql.typeAlias("void")`
        INSERT INTO tasks (workspace_id, column_id, title, position)
        VALUES (${b.workspaceId}, ${b.columnId}, 'B-task-1', 100),
               (${b.workspaceId}, ${b.columnId}, 'B-task-2', 200)
      `,
    );

    const tasksA = await queryListTasksForWorkspace(
      a.pool,
      toWorkspaceId(a.workspaceId),
    );
    const tasksB = await queryListTasksForWorkspace(
      b.pool,
      toWorkspaceId(b.workspaceId),
    );

    expect(tasksA.map((t) => t.title)).toEqual(["A-task-1", "A-task-2"]);
    expect(tasksB.map((t) => t.title)).toEqual(["B-task-1", "B-task-2"]);
  });

  test("excludes archived tasks", async () => {
    const ws = await seedWorkspaceWithColumn("w");

    await ws.pool.query(
      sql.typeAlias("void")`
        INSERT INTO tasks (workspace_id, column_id, title, archived, position)
        VALUES (${ws.workspaceId}, ${ws.columnId}, 'live',     false, 100),
               (${ws.workspaceId}, ${ws.columnId}, 'archived', true,  200)
      `,
    );

    const tasks = await queryListTasksForWorkspace(
      ws.pool,
      toWorkspaceId(ws.workspaceId),
    );

    expect(tasks.map((t) => t.title)).toEqual(["live"]);
  });

  test("orders tasks by position ascending within a column", async () => {
    const ws = await seedWorkspaceWithColumn("w");

    // Insert deliberately out of order.
    await ws.pool.query(
      sql.typeAlias("void")`
        INSERT INTO tasks (workspace_id, column_id, title, position)
        VALUES (${ws.workspaceId}, ${ws.columnId}, 'C', 3000),
               (${ws.workspaceId}, ${ws.columnId}, 'A', 1000),
               (${ws.workspaceId}, ${ws.columnId}, 'B', 2000)
      `,
    );

    const tasks = await queryListTasksForWorkspace(
      ws.pool,
      toWorkspaceId(ws.workspaceId),
    );

    expect(tasks.map((t) => t.title)).toEqual(["A", "B", "C"]);
  });

  test("returns an empty array when the workspace has no tasks", async () => {
    const ws = await seedWorkspaceWithColumn("empty");

    const tasks = await queryListTasksForWorkspace(
      ws.pool,
      toWorkspaceId(ws.workspaceId),
    );

    expect(tasks).toEqual([]);
  });
});
