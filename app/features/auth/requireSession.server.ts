import { redirect } from "react-router";
import type { ServerConfig } from "~/config/serverConfig.server";
import { getPool } from "~/database/pool.server";
import { hashToken } from "./hashToken.server";
import { queryFindSession } from "./queryFindSession.server";
import { queryRefreshSession } from "./queryRefreshSession.server";
import {
  readSessionTokenFromRequest,
  SESSION_MAX_AGE_S,
} from "./sessionCookie.server";
import type { Session } from "./sessionTypes";

/**
 * Require a valid session for the incoming request.
 *
 * On success: returns the branded `{ sessionId, userId, workspaceId, role }`
 * and slides the session's expiry forward.
 *
 * On failure: throws a `redirect("/")` Response. RR loaders/actions treat
 * thrown Responses as the loader/action's response, so callers just write
 *   `const session = await requireSession(config, request);`
 * and any unauthenticated path short-circuits to the sign-in page.
 */
export async function requireSession(
  config: ServerConfig,
  request: Request,
): Promise<Session> {
  const session = await readSession(config, request);
  if (session === null) {
    throw redirect("/");
  }
  return session;
}

/** Non-throwing variant — returns `null` instead of redirecting. */
export async function readSession(
  config: ServerConfig,
  request: Request,
): Promise<Session | null> {
  const token = await readSessionTokenFromRequest(config, request);
  if (token === null) return null;

  const pool = await getPool(config);
  const session = await queryFindSession(pool, hashToken(token));
  if (session === null) return null;

  // Slide the expiry forward.
  await queryRefreshSession(
    pool,
    session.sessionId,
    new Date(Date.now() + SESSION_MAX_AGE_S * 1000),
  );

  return session;
}
