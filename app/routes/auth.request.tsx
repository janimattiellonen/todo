import { redirect } from "react-router";
import { getServerConfig } from "~/config/serverConfig.server";
import { getPool } from "~/database/pool.server";
import { requestRateLimiter } from "~/features/auth/emailRateLimiter";
import { requestMagicLink } from "~/features/auth/requestMagicLink.server";
import { getEmailTransport } from "~/features/email/emailTransport.server";
import { getLogger } from "~/logger";
import type { Route } from "./+types/auth.request";

export async function action({ request }: Route.ActionArgs) {
  const config = getServerConfig();
  const logger = getLogger(config);
  const transport = getEmailTransport(config, logger);
  const pool = await getPool(config);

  const formData = await request.formData();

  const outcome = requestMagicLink(
    { config, pool, logger, transport, rateLimiter: requestRateLimiter },
    formData.get("email"),
  );

  return redirect(`/?status=${outcome.status}`);
}
