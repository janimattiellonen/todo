import type { ServerConfig } from "~/config/serverConfig.server";
import type { Logger } from "~/logger";
import type { EmailMessage } from "./emailMessage";
import type { EmailTransport } from "./emailTransport.server";

export function createResendEmailTransport(
  config: ServerConfig,
  logger: Logger,
): EmailTransport {
  if (!config.email.resendApiKey) {
    throw new Error("EMAIL_TRANSPORT=resend requires RESEND_API_KEY to be set");
  }
  const apiKey = config.email.resendApiKey;

  return {
    async send(message: EmailMessage) {
      // Dynamic import keeps the Resend SDK out of test runs that never
      // instantiate this transport.
      const { Resend } = await import("resend");
      const client = new Resend(apiKey);

      const { data, error } = await client.emails.send({
        from: message.from,
        to: message.to,
        subject: message.subject,
        html: message.body,
      });

      if (error) {
        logger.error({ error, to: message.to }, "Failed to send email");
        throw new Error(error.message);
      }

      const id = data?.id ?? "";
      logger.info({ id, to: message.to }, "Email sent");

      return { id };
    },
  };
}
