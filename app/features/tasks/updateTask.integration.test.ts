import { describe, expect, test } from "vitest";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { updateTask } from "~/features/tasks/updateTask.server";
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
  const colA = await pool.one(
    sql.type(idRow)`
      INSERT INTO columns (workspace_id, name, position)
      VALUES (${ws.id}, 'To do', 1024)
      RETURNING id
    `,
  );
  const colB = await pool.one(
    sql.type(idRow)`
      INSERT INTO columns (workspace_id, name, position)
      VALUES (${ws.id}, 'Done', 2048)
      RETURNING id
    `,
  );
  const task = await pool.one(
    sql.type(idRow)`
      INSERT INTO tasks (workspace_id, column_id, title, position)
      VALUES (${ws.id}, ${colA.id}, 'Original', 1024)
      RETURNING id
    `,
  );
  return {
    pool,
    workspaceId: ws.id,
    columnTodoId: colA.id,
    columnDoneId: colB.id,
    taskId: task.id,
  };
}

describe("updateTask", () => {
  test("updates title, description, column, assignee, due date", async () => {
    const ctx = await seedTaskInWorkspace("happy");
    const memberId = (
      await ctx.pool.one(
        sql.type(
          idRow,
        )`INSERT INTO users (email) VALUES ('m@example.com') RETURNING id`,
      )
    ).id;
    await ctx.pool.query(
      sql.typeAlias("void")`
        INSERT INTO workspace_members (workspace_id, user_id, role)
        VALUES (${ctx.workspaceId}, ${memberId}, 'admin')
      `,
    );

    const outcome = await updateTask(ctx.pool, toWorkspaceId(ctx.workspaceId), {
      taskId: ctx.taskId,
      title: "Refined",
      description: "New body",
      columnId: ctx.columnDoneId,
      assigneeUserId: memberId,
      dueDate: "2026-07-01",
    });

    expect(outcome.ok).toBe(true);
    const row = await ctx.pool.one(
      sql.type(
        z.object({
          title: z.string(),
          description: z.string().nullable(),
          column_id: z.string().uuid(),
          assignee_user_id: z.string().uuid().nullable(),
          due_date: z.string().nullable(),
        }),
      )`
        SELECT title, description, column_id, assignee_user_id, due_date
          FROM tasks WHERE id = ${ctx.taskId}
      `,
    );
    expect(row).toEqual({
      title: "Refined",
      description: "New body",
      column_id: ctx.columnDoneId,
      assignee_user_id: memberId,
      due_date: "2026-07-01",
    });
  });

  test("rejects cross-workspace task id (no leak)", async () => {
    const a = await seedTaskInWorkspace("A");
    const b = await seedTaskInWorkspace("B");

    const outcome = await updateTask(b.pool, toWorkspaceId(b.workspaceId), {
      taskId: a.taskId,
      title: "Hijack",
      description: null,
      columnId: b.columnTodoId,
      assigneeUserId: null,
      dueDate: null,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toMatch(/task not found/i);

    // The original task is untouched.
    const titles = await a.pool.any(
      sql.type(z.object({ title: z.string() }))`
        SELECT title FROM tasks WHERE id = ${a.taskId}
      `,
    );
    expect(titles[0]?.title).toBe("Original");
  });

  test("rejects when the new column belongs to a different workspace", async () => {
    const a = await seedTaskInWorkspace("X");
    const b = await seedTaskInWorkspace("Y");

    const outcome = await updateTask(a.pool, toWorkspaceId(a.workspaceId), {
      taskId: a.taskId,
      title: "Tampered",
      description: null,
      columnId: b.columnTodoId,
      assigneeUserId: null,
      dueDate: null,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toMatch(/column not found/i);
  });

  test("rejects when the new assignee is not a workspace member", async () => {
    const ctx = await seedTaskInWorkspace("Z");
    const outsiderId = (
      await ctx.pool.one(
        sql.type(
          idRow,
        )`INSERT INTO users (email) VALUES ('o@example.com') RETURNING id`,
      )
    ).id;

    const outcome = await updateTask(ctx.pool, toWorkspaceId(ctx.workspaceId), {
      taskId: ctx.taskId,
      title: "x",
      description: null,
      columnId: ctx.columnTodoId,
      assigneeUserId: outsiderId,
      dueDate: null,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toMatch(/assignee/i);
  });

  test("clearing the assignee + due date works (null payload)", async () => {
    const ctx = await seedTaskInWorkspace("clear");

    // Pre-set both.
    await ctx.pool.query(
      sql.typeAlias("void")`
        UPDATE tasks
           SET assignee_user_id = NULL,
               due_date = '2026-06-15'
         WHERE id = ${ctx.taskId}
      `,
    );

    const outcome = await updateTask(ctx.pool, toWorkspaceId(ctx.workspaceId), {
      taskId: ctx.taskId,
      title: "cleared",
      description: null,
      columnId: ctx.columnTodoId,
      assigneeUserId: null,
      dueDate: null,
    });

    expect(outcome.ok).toBe(true);
    const row = await ctx.pool.one(
      sql.type(
        z.object({
          assignee_user_id: z.string().uuid().nullable(),
          due_date: z.string().nullable(),
        }),
      )`
        SELECT assignee_user_id, due_date
          FROM tasks WHERE id = ${ctx.taskId}
      `,
    );
    expect(row.assignee_user_id).toBeNull();
    expect(row.due_date).toBeNull();
  });
});
