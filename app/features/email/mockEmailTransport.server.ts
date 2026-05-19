import type { Logger } from "~/logger";
import type { EmailMessage } from "./emailMessage";
import type { EmailTransport } from "./emailTransport.server";

export type MockEmailTransport = EmailTransport & {
  /** Messages captured since the last reset. Newest last. */
  readonly sentMessages: readonly EmailMessage[];
  /** Clear the capture buffer. Call from `beforeEach` in tests. */
  reset(): void;
};

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

      return Promise.resolve({ id });
    },
  };
}
