import { type DatabasePool, createPool as slonikCreatePool } from "slonik";
import type { ServerConfig } from "~/config/serverConfig.server";

let pool: DatabasePool | null = null;

export async function getPool(config: ServerConfig): Promise<DatabasePool> {
  if (pool === null) {
    pool = await slonikCreatePool(config.database.url);
  }

  return pool;
}
