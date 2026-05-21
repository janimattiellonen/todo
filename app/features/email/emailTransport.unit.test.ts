import { beforeEach, describe, expect, expectTypeOf, test, vi } from "vitest";
import type { Logger } from "~/logger";
import type { EmailMessage } from "./emailMessage";
import { createMockEmailTransport } from "./mockEmailTransport.server";

function createSilentLogger(): Logger {
  return {
    fatal: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
  } as unknown as Logger;
}

describe("EmailMessage type", () => {
  test("`to` is typed as a single string", () => {
    expectTypeOf<EmailMessage>().toHaveProperty("to").toEqualTypeOf<string>();
  });

  test("an array of recipients fails type-check", () => {
    // The @ts-expect-error below is the assertion: if EmailMessage ever
    // accepts `to: string[]`, the comment becomes "unused" → TS error.
    const _wrong: EmailMessage = {
      from: "n@example.com",
      // @ts-expect-error to must be a single string, not an array
      to: ["a@example.com", "b@example.com"],
      subject: "x",
      body: "y",
    };

    expect(_wrong).toBeDefined();
  });
});

describe("MockEmailTransport", () => {
  let transport: ReturnType<typeof createMockEmailTransport>;

  beforeEach(() => {
    transport = createMockEmailTransport(createSilentLogger());
  });

  test("captures sent messages in order", async () => {
    await transport.send({
      from: "n@example.com",
      to: "alice@example.com",
      subject: "Hello",
      body: "<p>Hi</p>",
    });
    await transport.send({
      from: "n@example.com",
      to: "bob@example.com",
      subject: "Howdy",
      body: "<p>Hi Bob</p>",
    });

    expect(transport.sentMessages).toHaveLength(2);
    expect(transport.sentMessages[0]?.to).toBe("alice@example.com");
    expect(transport.sentMessages[1]?.to).toBe("bob@example.com");
  });

  test("returns an id per send", async () => {
    const a = await transport.send({
      from: "n@example.com",
      to: "alice@example.com",
      subject: "x",
      body: "y",
    });
    const b = await transport.send({
      from: "n@example.com",
      to: "bob@example.com",
      subject: "x",
      body: "y",
    });

    expect(a.id).toBe("mock_1");
    expect(b.id).toBe("mock_2");
  });

  test("reset() clears captured messages and resets the counter", async () => {
    await transport.send({
      from: "n@example.com",
      to: "alice@example.com",
      subject: "x",
      body: "y",
    });
    expect(transport.sentMessages).toHaveLength(1);

    transport.reset();

    expect(transport.sentMessages).toHaveLength(0);

    const next = await transport.send({
      from: "n@example.com",
      to: "bob@example.com",
      subject: "x",
      body: "y",
    });
    expect(next.id).toBe("mock_1");
  });

  test("logs each unique URL in the body so the dev can click through", async () => {
    const logger = createSilentLogger();
    const t = createMockEmailTransport(logger);

    await t.send({
      from: "n@example.com",
      to: "alice@example.com",
      subject: "Sign in",
      body: `<a href="http://localhost:5172/auth/consume?token=abc123">Sign in</a>
             <p>or copy: http://localhost:5172/auth/consume?token=abc123</p>`,
    });

    // First info: the standard capture log.
    // Second info: the link log.
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "mock_1",
        // biome-ignore lint/security/noSecrets: Synthetic test fixture, not a real token.
        url: "http://localhost:5172/auth/consume?token=abc123",
      }),
      "[mock email] link",
    );
  });

  test("does not log a link when the body has no URL", async () => {
    const logger = createSilentLogger();
    const t = createMockEmailTransport(logger);

    await t.send({
      from: "n@example.com",
      to: "alice@example.com",
      subject: "x",
      body: "plain text, no links",
    });

    const linkLogs = (
      logger.info as ReturnType<typeof vi.fn>
    ).mock.calls.filter((call) => call[1] === "[mock email] link");
    expect(linkLogs).toHaveLength(0);
  });
});
