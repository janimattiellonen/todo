import type { Logger } from "~/logger";
import type { EmailMessage } from "./emailMessage";
import type { EmailTransport } from "./emailTransport.server";

export type MockEmailTransport = EmailTransport & {
  /** Messages captured since the last reset. Newest last. */
  readonly sentMessages: readonly EmailMessage[];
  /** Clear the capture buffer. Call from `beforeEach` in tests. */
  reset(): void;
};

const URL_REGEX = /https?:\/\/[^\s"'<>]+/g;

function extractUrls(body: string): string[] {
  const matches = body.match(URL_REGEX);
  if (!matches) return [];
  // De-duplicate while preserving order — templates often repeat the same
  // link in both a button href and a plain-text fallback.
  return Array.from(new Set(matches));
}

export function createMockEmailTransport(logger: Logger): MockEmailTransport {
  const sentMessages: EmailMessage[] = [];
  let counter = 0;

  return {
    get sentMessages() {
      return sentMessages;
    },
    reset() {
      sentMessages.length = 0;
      counter = 0;
    },
    send(message: EmailMessage): Promise<{ id: string }> {
      counter += 1;
      const id = `mock_${counter}`;

      sentMessages.push(message);
      logger.info(
        { id, to: message.to, subject: message.subject },
        "[mock email] captured",
      );

      // Surface any URLs in the body so the dev can click through without
      // an email gateway. Safe here because this branch only runs when
      // EMAIL_TRANSPORT=mock (dev/test by config).
      for (const url of extractUrls(message.body)) {
        logger.info({ id, url }, "[mock email] link");
      }

      return Promise.resolve({ id });
    },
  };
}
