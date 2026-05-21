import { getServerConfig } from "~/config/serverConfig.server";
import {
  getEmailTransport,
  getMockEmailTransportInstance,
} from "~/features/email/emailTransport.server";
import { getLogger } from "~/logger";
import type { Route } from "./+types/test.mock-emails";

/**
 * Test-only endpoint. Returns the list of messages captured by the mock
 * email transport in JSON form, newest last.
 *
 * Gated by BOTH:
 *   - `environment !== "production"` (env-level gate)
 *   - `email.transport === "mock"`   (config-level gate)
 *
 * Any other configuration → 404. This makes it safe even if
 * `EMAIL_TRANSPORT` is accidentally set to "mock" in a production build:
 * the env gate still 404s the endpoint.
 */
export function loader(_args: Route.LoaderArgs) {
  const config = getServerConfig();

  if (
    config.environment === "production" ||
    config.email.transport !== "mock"
  ) {
    throw new Response("Not found", { status: 404 });
  }

  // Touch the factory so the singleton exists even if no email has been
  // sent yet — keeps the endpoint shape consistent.
  getEmailTransport(config, getLogger(config));
  const mock = getMockEmailTransportInstance();

  return { messages: mock === null ? [] : [...mock.sentMessages] };
}
