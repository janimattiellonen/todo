import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runMigrations } from "~/database/runMigrations.server";
import type { Logger } from "~/logger";

export async function migrateTestDatabase(
  logger: Logger,
  databaseUrl: string,
): Promise<void> {
  await runMigrations(databaseUrl, getMigrationsDir(), logger);
}

function getMigrationsDir(): string {
  const __dirname = fileURLToPath(new URL(".", import.meta.url));

  return join(__dirname, "..", "..", "database", "migrations");
}
