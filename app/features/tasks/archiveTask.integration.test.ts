import { describe, expect, test } from "vitest";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { archiveTask } from "~/features/tasks/archiveTask.server";
import { toTaskId } from "~/features/tasks/tasksTypes";
import { toWorkspaceId } from "~/features/workspaces/workspacesTypes";
import { createTestPool } from "~/test/database/createTestPool";

const idRow = z.strictObject({ id: z.string().uuid() });

async function seedWorkspaceWithTask(prefix: string) {
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
  const task = await pool.one(
    sql.type(idRow)`
      INSERT INTO tasks (workspace_id, column_id, title, position)
      VALUES (${ws.id}, ${col.id}, 'doomed', 1024)
      RETURNING id
    `,
  );
  return { pool, workspaceId: ws.id, taskId: task.id };
}

describe("archiveTask", () => {
  test("first archive sets archived=true and updated_at advances", async () => {
    const ctx = await seedWorkspaceWithTask("happy");
    const before = await ctx.pool.one(
      sql.type(
        z.object({ archived: z.boolean(), updated_at: z.coerce.number() }),
      )`SELECT archived, updated_at FROM tasks WHERE id = ${ctx.taskId}`,
    );
    expect(before.archived).toBe(false);

    // 2-ms wait so updated_at can move.
    await new Promise((r) => setTimeout(r, 2));

    const outcome = await archiveTask(
      ctx.pool,
      toWorkspaceId(ctx.workspaceId),
      toTaskId(ctx.taskId),
    );

    expect(outcome.ok).toBe(true);
    const after = await ctx.pool.one(
      sql.type(
        z.object({ archived: z.boolean(), updated_at: z.coerce.number() }),
      )`SELECT archived, updated_at FROM tasks WHERE id = ${ctx.taskId}`,
    );
    expect(after.archived).toBe(true);
    expect(after.updated_at).toBeGreaterThan(before.updated_at);
  });

  test("idempotent: archiving an already-archived task succeeds", async () => {
    const ctx = await seedWorkspaceWithTask("idempotent");

    const first = await archiveTask(
      ctx.pool,
      toWorkspaceId(ctx.workspaceId),
      toTaskId(ctx.taskId),
    );
    expect(first.ok).toBe(true);

    const second = await archiveTask(
      ctx.pool,
      toWorkspaceId(ctx.workspaceId),
      toTaskId(ctx.taskId),
    );
    expect(second.ok).toBe(true);

    // Row is still archived (didn't get un-archived).
    const row = await ctx.pool.one(
      sql.type(z.object({ archived: z.boolean() }))`
        SELECT archived FROM tasks WHERE id = ${ctx.taskId}
      `,
    );
    expect(row.archived).toBe(true);
  });

  test("rejects cross-workspace task id without changing anything", async () => {
    const a = await seedWorkspaceWithTask("A");
    const b = await seedWorkspaceWithTask("B");

    const outcome = await archiveTask(
      b.pool,
      toWorkspaceId(b.workspaceId),
      toTaskId(a.taskId),
    );

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toMatch(/task not found/i);

    const row = await a.pool.one(
      sql.type(z.object({ archived: z.boolean() }))`
        SELECT archived FROM tasks WHERE id = ${a.taskId}
      `,
    );
    expect(row.archived).toBe(false);
  });
});
