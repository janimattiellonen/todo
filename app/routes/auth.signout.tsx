import { redirect } from "react-router";
import { getServerConfig } from "~/config/serverConfig.server";
import { getPool } from "~/database/pool.server";
import { hashToken } from "~/features/auth/hashToken.server";
import { queryDeleteSession } from "~/features/auth/queryDeleteSession.server";
import {
  clearSessionCookieHeader,
  readSessionTokenFromRequest,
} from "~/features/auth/sessionCookie.server";
import type { Route } from "./+types/auth.signout";

export async function action({ request }: Route.ActionArgs) {
  const config = getServerConfig();
  const token = await readSessionTokenFromRequest(config, request);

  if (token !== null) {
    const pool = await getPool(config);
    await queryDeleteSession(pool, hashToken(token));
  }

  return redirect("/", {
    headers: { "Set-Cookie": await clearSessionCookieHeader(config) },
  });
}
