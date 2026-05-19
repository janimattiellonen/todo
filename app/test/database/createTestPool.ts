import { createPool, type DatabasePool } from "slonik";
import { getServerConfig } from "~/config/serverConfig.server";

let pool: DatabasePool | null = null;

export async function createTestPool(): Promise<DatabasePool> {
  if (pool !== null) {
    return pool;
  }

  const config = getServerConfig();
  pool = await createPool(config.database.url);

  return pool;
}

export async function closeTestPool(): Promise<void> {
  if (pool !== null) {
    await pool.end();
    pool = null;
  }
}
