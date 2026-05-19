import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createPool, sql } from "slonik";
import * as z from "zod";

type Logger = {
  info: (message: string) => void;
};

const COMMENT_REGEX = /^(--.*)$/;

/**
 * Split a SQL file into individual statements by semicolon, discarding
 * whitespace-only and comment-only fragments.
 */
function splitSqlStatements(sqlContent: string): string[] {
  return sqlContent
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !COMMENT_REGEX.test(s));
}

export async function runMigrations(
  databaseUrl: string,
  migrationsDir: string,
  logger: Logger,
): Promise<void> {
  const pool = await createPool(databaseUrl);

  try {
    await pool.query(sql.unsafe`
      CREATE TABLE IF NOT EXISTS _migrations (
        name       text        NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT _migrations_pkey PRIMARY KEY (name)
      )
    `);

    const rows = await pool.any(
      sql.type(
        z.object({
          name: z.string(),
        }),
      )`
        SELECT name FROM _migrations
      `,
    );
    const applied = new Set(rows.map((row) => row.name));

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        logger.info(`Skip migration (already applied): ${file}`);
        continue;
      }

      const content = readFileSync(join(migrationsDir, file), "utf8");

      await pool.transaction(async (connection) => {
        for (const statement of splitSqlStatements(content)) {
          // Construct a QuerySqlToken directly so that the file content is used
          // as the raw SQL string. sql.unsafe requires a real template literal
          // (not a runtime string). By constructing the token object directly
          // with the correct symbol type, we bypass that restriction.
          await connection.query({
            parser: z.any(),
            sql: statement,
            // biome-ignore lint/suspicious/noExplicitAny: Constructing QuerySqlToken directly to execute raw SQL from file.
            type: Symbol.for("SLONIK_TOKEN_QUERY") as any,
            values: [],
          });
        }

        await connection.query(
          sql.unsafe`INSERT INTO _migrations (name) VALUES (${file})`,
        );
      });

      logger.info(`Apply migration: ${file}`);
    }

    logger.info("Migrations completed");
  } finally {
    await pool.end();
  }
}
