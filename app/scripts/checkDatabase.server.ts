import { z } from "zod";
import { getPool } from "~/database/pool.server";
import { sql } from "~/database/sql.server";
import { runScript } from "~/scripts/runScript.server";

const oneRow = z.strictObject({ one: z.literal(1) });

await runScript(async ({ config, logger }) => {
  const pool = await getPool(config);

  try {
    const row = await pool.one(sql.type(oneRow)`SELECT 1 AS one`);

    logger.info({ row }, "Database round-trip succeeded");
  } finally {
    await pool.end();
  }
});
