import process from "node:process";
import { loadEnv } from "vite";
import { getServerConfig } from "~/config/serverConfig.server";
import { getLogger } from "~/logger";
import { migrateTestDatabase } from "~/test/database/migrateTestDatabase";

export async function setup(): Promise<void> {
  // Global setup runs in isolated context, so load env vars manually.
  Object.assign(process.env, loadEnv("test", process.cwd(), ""));

  const config = getServerConfig();
  const logger = getLogger(config);

  await migrateTestDatabase(logger, config.database.url);
}
