import { describe, expect, test } from "vitest";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { toColumnId } from "~/features/columns/columnsTypes";
import { moveTask } from "~/features/tasks/moveTask.server";
import { toTaskId } from "~/features/tasks/tasksTypes";
import { toWorkspaceId } from "~/features/workspaces/workspacesTypes";
import { createTestPool } from "~/test/database/createTestPool";

const idRow = z.strictObject({ id: z.string().uuid() });

async function seedWorkspaceWithTwoColumns(prefix: string) {
  const pool = await createTestPool();
  const ws = await pool.one(
    sql.type(
      idRow,
    )`INSERT INTO workspaces (name) VALUES (${`${prefix} ws`}) RETURNING id`,
  );
  const todo = await pool.one(
    sql.type(idRow)`
      INSERT INTO columns (workspace_id, name, position)
      VALUES (${ws.id}, 'To do', 1024)
      RETURNING id
    `,
  );
  const done = await pool.one(
    sql.type(idRow)`
      INSERT INTO columns (workspace_id, name, position)
      VALUES (${ws.id}, 'Done', 2048)
      RETURNING id
    `,
  );
  return {
    pool,
    workspaceId: ws.id,
    todoColumnId: todo.id,
    doneColumnId: done.id,
  };
}

async function seedTask(
  pool: Awaited<ReturnType<typeof createTestPool>>,
  workspaceId: string,
  columnId: string,
  title: string,
  position: number,
) {
  const row = await pool.one(
    sql.type(idRow)`
      INSERT INTO tasks (workspace_id, column_id, title, position)
      VALUES (${workspaceId}, ${columnId}, ${title}, ${position})
      RETURNING id
    `,
  );
  return row.id;
}

describe("moveTask", () => {
  test("cross-column move: task ends up in the destination with a fresh position", async () => {
    const ctx = await seedWorkspaceWithTwoColumns("xcol");
    const taskId = await seedTask(
      ctx.pool,
      ctx.workspaceId,
      ctx.todoColumnId,
      "moving",
      1024,
    );
    // Done column already has two tasks at 1024 and 2048.
    await seedTask(ctx.pool, ctx.workspaceId, ctx.doneColumnId, "d-a", 1024);
    await seedTask(ctx.pool, ctx.workspaceId, ctx.doneColumnId, "d-b", 2048);

    // Drop between them (index 1).
    const outcome = await moveTask(ctx.pool, toWorkspaceId(ctx.workspaceId), {
      taskId: toTaskId(taskId),
      destinationColumnId: toColumnId(ctx.doneColumnId),
      destinationIndex: 1,
    });

    expect(outcome.ok).toBe(true);
    const after = await ctx.pool.any(
      sql.type(z.object({ title: z.string(), position: z.coerce.number() }))`
        SELECT title, position FROM tasks
         WHERE column_id = ${ctx.doneColumnId}
         ORDER BY position ASC
      `,
    );
    expect(after.map((r) => r.title)).toEqual(["d-a", "moving", "d-b"]);
    expect(after[1]?.position).toBe(1536); // midpoint of 1024 & 2048
  });

  test("same-column reorder: moving task slots between neighbours", async () => {
    const ctx = await seedWorkspaceWithTwoColumns("same");
    const t1 = await seedTask(
      ctx.pool,
      ctx.workspaceId,
      ctx.todoColumnId,
      "A",
      1024,
    );
    const t2 = await seedTask(
      ctx.pool,
      ctx.workspaceId,
      ctx.todoColumnId,
      "B",
      2048,
    );
    const t3 = await seedTask(
      ctx.pool,
      ctx.workspaceId,
      ctx.todoColumnId,
      "C",
      3072,
    );

    // Move A from index 0 to index 2 (end of [B, C]).
    const outcome = await moveTask(ctx.pool, toWorkspaceId(ctx.workspaceId), {
      taskId: toTaskId(t1),
      destinationColumnId: toColumnId(ctx.todoColumnId),
      destinationIndex: 2,
    });

    expect(outcome.ok).toBe(true);
    const after = await ctx.pool.any(
      sql.type(z.object({ title: z.string() }))`
        SELECT title FROM tasks
         WHERE column_id = ${ctx.todoColumnId}
         ORDER BY position ASC
      `,
    );
    expect(after.map((r) => r.title)).toEqual(["B", "C", "A"]);
    void t2;
    void t3;
  });

  test("rejects cross-workspace task ids", async () => {
    const a = await seedWorkspaceWithTwoColumns("A");
    const b = await seedWorkspaceWithTwoColumns("B");
    const aTask = await seedTask(
      a.pool,
      a.workspaceId,
      a.todoColumnId,
      "a-task",
      1024,
    );

    const outcome = await moveTask(b.pool, toWorkspaceId(b.workspaceId), {
      taskId: toTaskId(aTask),
      destinationColumnId: toColumnId(b.doneColumnId),
      destinationIndex: 0,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toMatch(/task not found/i);
  });

  test("rejects when the destination column is in a different workspace", async () => {
    const a = await seedWorkspaceWithTwoColumns("A2");
    const b = await seedWorkspaceWithTwoColumns("B2");
    const aTask = await seedTask(
      a.pool,
      a.workspaceId,
      a.todoColumnId,
      "a-task",
      1024,
    );

    const outcome = await moveTask(a.pool, toWorkspaceId(a.workspaceId), {
      taskId: toTaskId(aTask),
      destinationColumnId: toColumnId(b.todoColumnId),
      destinationIndex: 0,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toMatch(/column not found/i);
  });

  test("excludes the moving task from neighbour position computation", async () => {
    // If we did NOT exclude the moving task from its current column's
    // positions, dropping at the same index would compute a midpoint
    // between the task and itself — nonsensical. This regression test
    // exercises the exclusion path explicitly.
    const ctx = await seedWorkspaceWithTwoColumns("excl");
    const t1 = await seedTask(
      ctx.pool,
      ctx.workspaceId,
      ctx.todoColumnId,
      "first",
      1024,
    );
    const _t2 = await seedTask(
      ctx.pool,
      ctx.workspaceId,
      ctx.todoColumnId,
      "second",
      2048,
    );
    void _t2;

    // Move t1 to "index 1" within the same column (so it becomes the end).
    const outcome = await moveTask(ctx.pool, toWorkspaceId(ctx.workspaceId), {
      taskId: toTaskId(t1),
      destinationColumnId: toColumnId(ctx.todoColumnId),
      destinationIndex: 1,
    });

    expect(outcome.ok).toBe(true);
    const after = await ctx.pool.any(
      sql.type(z.object({ title: z.string() }))`
        SELECT title FROM tasks
         WHERE column_id = ${ctx.todoColumnId}
         ORDER BY position ASC
      `,
    );
    expect(after.map((r) => r.title)).toEqual(["second", "first"]);
  });
});
