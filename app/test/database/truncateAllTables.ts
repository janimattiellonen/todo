import type { DatabasePool } from "slonik";

/**
 * Truncate all domain tables to reset state between integration tests.
 *
 * Currently a no-op — no domain tables exist yet. When the first domain
 * table lands, add it here (use `TRUNCATE <table>, ... CASCADE`) and wire
 * a `beforeEach` call in `app/test/integration/setup.ts`. Do not truncate
 * `_migrations` — that is the migration tracker, not domain state.
 */
export async function truncateAllTables(_pool: DatabasePool): Promise<void> {
  // intentionally empty
}
