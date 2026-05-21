import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { getServerConfig } from "~/config/serverConfig.server";
import { sql } from "~/database/sql.server";
import { createEmailRateLimiter } from "~/features/auth/emailRateLimiter";
import {
  flushPendingWork,
  type RequestMagicLinkContext,
  requestMagicLink,
} from "~/features/auth/requestMagicLink.server";
import { createMockEmailTransport } from "~/features/email/mockEmailTransport.server";
import type { Logger } from "~/logger";
import { createTestPool } from "~/test/database/createTestPool";

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

async function createCtx(): Promise<
  RequestMagicLinkContext & {
    transport: ReturnType<typeof createMockEmailTransport>;
    rateLimiter: ReturnType<typeof createEmailRateLimiter>;
  }
> {
  const config = getServerConfig();
  const pool = await createTestPool();
  const logger = createSilentLogger();
  const transport = createMockEmailTransport(logger);
  const rateLimiter = createEmailRateLimiter();
  return { config, pool, logger, transport, rateLimiter };
}

const tokenRow = z.strictObject({
  user_id: z.string().uuid(),
  token_hash: z.string(),
  // Slonik returns timestamptz as a Unix-epoch number by default.
  expires_at: z.number(),
});

describe("requestMagicLink", () => {
  beforeEach(async () => {
    // Truncate already runs via setup beforeEach; nothing else to reset.
  });

  test("returns 'invalid' for unparsable input — no token, no email", async () => {
    const ctx = await createCtx();

    const outcome = requestMagicLink(ctx, "not-an-email");
    await flushPendingWork();

    expect(outcome).toEqual({ status: "invalid" });
    expect(ctx.transport.sentMessages).toHaveLength(0);
  });

  test("returns 'sent' for a valid email with NO matching user — no token, no email (no account-existence leak)", async () => {
    const ctx = await createCtx();

    const outcome = requestMagicLink(ctx, "nobody@example.com");
    await flushPendingWork();

    expect(outcome).toEqual({ status: "sent" });
    expect(ctx.transport.sentMessages).toHaveLength(0);

    // Nothing in the tokens table either.
    const tokens = await ctx.pool.any(
      sql.type(z.object({ count: z.coerce.number() }))`
        SELECT COUNT(*)::int AS count FROM magic_link_tokens
      `,
    );
    expect(tokens[0]?.count).toBe(0);
  });

  test("returns 'sent' for a valid email with a matching user — token persisted, email captured", async () => {
    const ctx = await createCtx();

    // Seed a user.
    const seeded = await ctx.pool.one(
      sql.type(z.object({ id: z.string().uuid() }))`
        INSERT INTO users (email, name) VALUES ('alice@example.com', 'Alice')
        RETURNING id
      `,
    );

    const outcome = requestMagicLink(ctx, "alice@example.com");
    await flushPendingWork();

    expect(outcome).toEqual({ status: "sent" });

    // One captured email to the right recipient.
    expect(ctx.transport.sentMessages).toHaveLength(1);
    expect(ctx.transport.sentMessages[0]?.to).toBe("alice@example.com");
    expect(ctx.transport.sentMessages[0]?.subject).toMatch(/sign in/i);

    // The plaintext token appears in the email body but NOT in the DB.
    const body = ctx.transport.sentMessages[0]?.body ?? "";
    const tokenInLink = body.match(/[?&]token=([A-Za-z0-9_-]+)/)?.[1];
    expect(tokenInLink).toMatch(/^[A-Za-z0-9_-]{43}$/);

    // The DB row stores only the hash, not the plaintext.
    const tokens = await ctx.pool.any(
      sql.type(tokenRow)`
        SELECT user_id, token_hash, expires_at FROM magic_link_tokens
      `,
    );
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.user_id).toBe(seeded.id);
    expect(tokens[0]?.token_hash).not.toBe(tokenInLink);
    expect(tokens[0]?.token_hash).toMatch(/^[0-9a-f]{64}$/);

    // Expiry is in the future, within ~15 minutes.
    const now = Date.now();
    const expiresAtMs = tokens[0]?.expires_at ?? 0;
    expect(expiresAtMs).toBeGreaterThan(now);
    expect(expiresAtMs - now).toBeLessThanOrEqual(15 * 60 * 1000 + 5000);
  });

  test("rate-limited request returns 'sent' but does NO work (no token, no email)", async () => {
    const ctx = await createCtx();

    await ctx.pool.query(
      sql.typeAlias("void")`
        INSERT INTO users (email, name) VALUES ('alice@example.com', 'Alice')
      `,
    );

    // Burn the 3-per-minute budget.
    for (let i = 0; i < 3; i++) {
      requestMagicLink(ctx, "alice@example.com");
    }
    await flushPendingWork();
    ctx.transport.reset();

    // 4th request — same neutral response, no work.
    const outcome = requestMagicLink(ctx, "alice@example.com");
    await flushPendingWork();

    expect(outcome).toEqual({ status: "sent" });
    expect(ctx.transport.sentMessages).toHaveLength(0);
  });
});
