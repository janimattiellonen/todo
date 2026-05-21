import { redirect } from "react-router";
import { getServerConfig } from "~/config/serverConfig.server";
import { getPool } from "~/database/pool.server";
import { consumeMagicLink } from "~/features/auth/consumeMagicLink.server";
import { hashToken } from "~/features/auth/hashToken.server";
import {
  serializeSessionCookie,
  serializeSetupCookie,
} from "~/features/auth/sessionCookie.server";
import { getLogger } from "~/logger";
import type { Route } from "./+types/auth.consume";

export async function loader({ request }: Route.LoaderArgs) {
  const config = getServerConfig();
  const logger = getLogger(config);

  const url = new URL(request.url);
  const plaintext = url.searchParams.get("token");
  if (plaintext === null || plaintext.length === 0) {
    return redirect("/?status=invalid_link");
  }

  const pool = await getPool(config);
  const outcome = await consumeMagicLink(pool, hashToken(plaintext));

  if (outcome.status === "invalid") {
    logger.info("magic-link consume: invalid token");
    return redirect("/?status=invalid_link");
  }

  if (outcome.status === "signed-in") {
    const setCookie = await serializeSessionCookie(
      config,
      outcome.sessionToken,
    );
    return redirect("/board", { headers: { "Set-Cookie": setCookie } });
  }

  // outcome.status === "needs-workspace" — stash the user id in a signed,
  // short-lived setup cookie and prompt for a workspace name.
  const setupCookie = await serializeSetupCookie(config, {
    userId: outcome.userId,
    emailLocalpart: outcome.emailLocalpart,
  });
  return redirect("/setup/workspace", {
    headers: { "Set-Cookie": setupCookie },
  });
}
