import { describe, expect, test } from "vitest";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { queryListColumnsForWorkspace } from "~/features/columns/queryListColumnsForWorkspace.server";
import { toWorkspaceId } from "~/features/workspaces/workspacesTypes";
import { createTestPool } from "~/test/database/createTestPool";

const wsRow = z.strictObject({ id: z.string().uuid() });

// biome-ignore lint/security/noSecrets: Describe label, not a secret.
describe("queryListColumnsForWorkspace — workspace isolation", () => {
  test("a query for workspace A returns only workspace A's columns", async () => {
    const pool = await createTestPool();

    // Workspace A — three columns.
    const wsA = await pool.one(
      sql.type(
        wsRow,
      )`INSERT INTO workspaces (name) VALUES ('ws A') RETURNING id`,
    );
    await pool.query(
      sql.typeAlias("void")`
        INSERT INTO columns (workspace_id, name, position)
        VALUES (${wsA.id}, 'A1', 100),
               (${wsA.id}, 'A2', 200),
               (${wsA.id}, 'A3', 300)
      `,
    );

    // Workspace B — different three columns. Same names as A would
    // hide a bug where the WHERE clause is missing — use distinct
    // names so a leak is unambiguous.
    const wsB = await pool.one(
      sql.type(
        wsRow,
      )`INSERT INTO workspaces (name) VALUES ('ws B') RETURNING id`,
    );
    await pool.query(
      sql.typeAlias("void")`
        INSERT INTO columns (workspace_id, name, position)
        VALUES (${wsB.id}, 'B1', 100),
               (${wsB.id}, 'B2', 200),
               (${wsB.id}, 'B3', 300)
      `,
    );

    const colsForA = await queryListColumnsForWorkspace(
      pool,
      toWorkspaceId(wsA.id),
    );
    const colsForB = await queryListColumnsForWorkspace(
      pool,
      toWorkspaceId(wsB.id),
    );

    expect(colsForA.map((c) => c.name)).toEqual(["A1", "A2", "A3"]);
    expect(colsForB.map((c) => c.name)).toEqual(["B1", "B2", "B3"]);
  });

  test("orders columns by position ascending", async () => {
    const pool = await createTestPool();

    const ws = await pool.one(
      sql.type(wsRow)`INSERT INTO workspaces (name) VALUES ('w') RETURNING id`,
    );
    // Insert in reverse order to assert the SELECT reorders.
    await pool.query(
      sql.typeAlias("void")`
        INSERT INTO columns (workspace_id, name, position)
        VALUES (${ws.id}, 'Z', 3000),
               (${ws.id}, 'A', 1000),
               (${ws.id}, 'M', 2000)
      `,
    );

    const cols = await queryListColumnsForWorkspace(pool, toWorkspaceId(ws.id));

    expect(cols.map((c) => c.name)).toEqual(["A", "M", "Z"]);
  });

  test("returns empty array for a workspace with no columns", async () => {
    const pool = await createTestPool();
    const ws = await pool.one(
      sql.type(
        wsRow,
      )`INSERT INTO workspaces (name) VALUES ('empty') RETURNING id`,
    );

    const cols = await queryListColumnsForWorkspace(pool, toWorkspaceId(ws.id));

    expect(cols).toEqual([]);
  });
});
