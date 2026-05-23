import { describe, expect, test } from "vitest";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { deleteTask } from "~/features/tasks/deleteTask.server";
import { toTaskId } from "~/features/tasks/tasksTypes";
import { toWorkspaceId } from "~/features/workspaces/workspacesTypes";
import { createTestPool } from "~/test/database/createTestPool";

const idRow = z.strictObject({ id: z.string().uuid() });

async function seedTaskInWorkspace(prefix: string) {
  const pool = await createTestPool();
  const ws = await pool.one(
    sql.type(
      idRow,
    )`INSERT INTO workspaces (name) VALUES (${`${prefix} ws`}) RETURNING id`,
  );
  const col = await pool.one(
    sql.type(idRow)`
      INSERT INTO columns (workspace_id, name, position)
      VALUES (${ws.id}, 'To do', 1024)
      RETURNING id
    `,
  );
  return { pool, workspaceId: ws.id, columnId: col.id };
}

describe("deleteTask", () => {
  test("hard-deletes the matching task", async () => {
    const ctx = await seedTaskInWorkspace("happy");
    const task = await ctx.pool.one(
      sql.type(idRow)`
        INSERT INTO tasks (workspace_id, column_id, title, position)
        VALUES (${ctx.workspaceId}, ${ctx.columnId}, 'doomed', 1024)
        RETURNING id
      `,
    );

    const outcome = await deleteTask(
      ctx.pool,
      toWorkspaceId(ctx.workspaceId),
      toTaskId(task.id),
    );

    expect(outcome.ok).toBe(true);
    const remaining = await ctx.pool.one(
      sql.type(z.object({ count: z.coerce.number() }))`
        SELECT COUNT(*)::int AS count FROM tasks WHERE id = ${task.id}
      `,
    );
    expect(remaining.count).toBe(0);
  });

  test("rejects cross-workspace task id without deleting anything", async () => {
    const a = await seedTaskInWorkspace("A");
    const b = await seedTaskInWorkspace("B");
    const aTask = await a.pool.one(
      sql.type(idRow)`
        INSERT INTO tasks (workspace_id, column_id, title, position)
        VALUES (${a.workspaceId}, ${a.columnId}, 'A-task', 1024)
        RETURNING id
      `,
    );

    // B's session attempts to delete A's task — must fail.
    const outcome = await deleteTask(
      b.pool,
      toWorkspaceId(b.workspaceId),
      toTaskId(aTask.id),
    );

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toMatch(/task not found/i);

    const stillThere = await a.pool.one(
      sql.type(z.object({ count: z.coerce.number() }))`
        SELECT COUNT(*)::int AS count FROM tasks WHERE id = ${aTask.id}
      `,
    );
    expect(stillThere.count).toBe(1);
  });

  test("does not renumber adjacent tasks in the column", async () => {
    const ctx = await seedTaskInWorkspace("sparse");
    const t1 = await ctx.pool.one(
      sql.type(idRow)`
        INSERT INTO tasks (workspace_id, column_id, title, position)
        VALUES (${ctx.workspaceId}, ${ctx.columnId}, 'first',  1024)
        RETURNING id
      `,
    );
    const _t2 = await ctx.pool.one(
      sql.type(idRow)`
        INSERT INTO tasks (workspace_id, column_id, title, position)
        VALUES (${ctx.workspaceId}, ${ctx.columnId}, 'middle', 2048)
        RETURNING id
      `,
    );
    void _t2;
    const t3 = await ctx.pool.one(
      sql.type(idRow)`
        INSERT INTO tasks (workspace_id, column_id, title, position)
        VALUES (${ctx.workspaceId}, ${ctx.columnId}, 'last',   3072)
        RETURNING id
      `,
    );

    // Delete the middle one.
    const outcome = await deleteTask(
      ctx.pool,
      toWorkspaceId(ctx.workspaceId),
      toTaskId(_t2.id),
    );
    expect(outcome.ok).toBe(true);

    const remaining = await ctx.pool.any(
      sql.type(z.object({ title: z.string(), position: z.coerce.number() }))`
        SELECT title, position FROM tasks
         WHERE column_id = ${ctx.columnId}
         ORDER BY position ASC
      `,
    );

    // Adjacent positions are unchanged — sparse positioning is fine.
    expect(remaining).toEqual([
      { title: "first", position: 1024 },
      { title: "last", position: 3072 },
    ]);
    void t1;
    void t3;
  });

  test("returns ok: false for a task that does not exist", async () => {
    const ctx = await seedTaskInWorkspace("missing");

    const outcome = await deleteTask(
      ctx.pool,
      toWorkspaceId(ctx.workspaceId),
      toTaskId("11111111-1111-4111-8111-111111111111"),
    );

    expect(outcome.ok).toBe(false);
  });
});
