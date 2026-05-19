import type { ServerConfig } from "~/config/serverConfig.server";
import { createMockEmailTransport } from "~/features/email/mockEmailTransport.server";
import { createResendEmailTransport } from "~/features/email/resendTransport.server";
import type { Logger } from "~/logger";
import type { EmailMessage } from "./emailMessage";

export type EmailTransport = {
  send(message: EmailMessage): Promise<{ id: string }>;
};

export function getEmailTransport(
  config: ServerConfig,
  logger: Logger,
): EmailTransport {
  switch (config.email.transport) {
    case "mock":
      return createMockEmailTransport(logger);
    case "resend":
      return createResendEmailTransport(config, logger);
  }
}
