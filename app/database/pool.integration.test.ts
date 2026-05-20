import { describe, expect, test } from "vitest";
import { z } from "zod";
import { sql } from "~/database/sql.server";
import { createTestPool } from "~/test/database/createTestPool";

const oneRow = z.strictObject({ one: z.literal(1) });

describe("test database pool", () => {
  test("opens a pool and round-trips SELECT 1", async () => {
    const pool = await createTestPool();

    const row = await pool.one(sql.type(oneRow)`SELECT 1 AS one`);

    expect(row.one).toBe(1);
  });

  test("globalSetup ran migrations — _migrations table exists", async () => {
    const pool = await createTestPool();

    const rows = await pool.any(
      sql.type(z.object({ name: z.string() }))`
        SELECT name FROM _migrations ORDER BY name
      `,
    );

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.name).toBe("001-init.sql");
  });
});
