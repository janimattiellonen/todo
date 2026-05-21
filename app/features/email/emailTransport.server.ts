import type { ServerConfig } from "~/config/serverConfig.server";
import {
  createMockEmailTransport,
  type MockEmailTransport,
} from "~/features/email/mockEmailTransport.server";
import { createResendEmailTransport } from "~/features/email/resendTransport.server";
import type { Logger } from "~/logger";
import type { EmailMessage } from "./emailMessage";

export type EmailTransport = {
  send(message: EmailMessage): Promise<{ id: string }>;
};

/**
 * The mock transport is cached at module scope so that captured messages
 * survive across requests in the dev server. This lets the dev / e2e
 * test endpoint (`/test/__mock-emails`) see what was sent in earlier
 * requests. The Resend transport is not cached because it has no in-
 * memory state worth sharing.
 */
let mockSingleton: MockEmailTransport | null = null;

export function getEmailTransport(
  config: ServerConfig,
  logger: Logger,
): EmailTransport {
  switch (config.email.transport) {
    case "mock":
      if (mockSingleton === null) {
        mockSingleton = createMockEmailTransport(logger);
      }
      return mockSingleton;
    case "resend":
      return createResendEmailTransport(config, logger);
  }
}

/** Process-wide accessor used by the gated test endpoint. */
export function getMockEmailTransportInstance(): MockEmailTransport | null {
  return mockSingleton;
}
