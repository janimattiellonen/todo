import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runMigrations } from "~/database/runMigrations.server";
import { runScript, type ScriptContext } from "~/scripts/runScript.server";

async function script(context: ScriptContext) {
  const migrationsDir = getMigrationsDir();

  await runMigrations(
    context.config.database.url,
    migrationsDir,
    context.logger,
  );
}

function getMigrationsDir() {
  const __dirname = fileURLToPath(new URL(".", import.meta.url));

  return join(__dirname, "..", "database", "migrations");
}

await runScript(script);
