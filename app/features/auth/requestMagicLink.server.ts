import type { DatabasePool } from "slonik";
import type { ServerConfig } from "~/config/serverConfig.server";
import type { EmailTransport } from "~/features/email/emailTransport.server";
import { magicLinkEmail } from "~/features/email/templates/magicLinkEmail";
import { queryFindUserByEmail } from "~/features/users/queryFindUserByEmail.server";
import type { Logger } from "~/logger";
import type { RateLimiter } from "./emailRateLimiter";
import { generateMagicLinkToken } from "./generateMagicLinkToken.server";
import { queryInsertMagicLinkToken } from "./queryInsertMagicLinkToken.server";
import { parseEmail } from "./validateEmail";

export type RequestMagicLinkContext = {
  config: ServerConfig;
  pool: DatabasePool;
  logger: Logger;
  transport: EmailTransport;
  rateLimiter: RateLimiter;
};

export type RequestMagicLinkOutcome =
  | { status: "sent" }
  | { status: "invalid" };

const TOKEN_TTL_MS = 15 * 60 * 1000;

/**
 * Track in-flight background work so tests can await it.
 *
 * The action handler intentionally fires work without awaiting so the
 * response time is constant whether or not the email matches an account
 * (timing-attack mitigation). Tests need a way to wait — that's what this
 * is.
 */
const pendingWork = new Set<Promise<void>>();

export function flushPendingWork(): Promise<void> {
  return Promise.allSettled(pendingWork).then(() => undefined);
}

/**
 * Handle a magic-link request.
 *
 * Synchronously: validate the email, check the rate limit, return the
 * outcome. The real work (DB lookup, token issuance, email send) is
 * dispatched fire-and-forget so the response timing does not leak
 * whether the email matches an account.
 *
 * Outcomes are deliberately coarse:
 *   "sent"    — the email was valid and we'll dispatch (or not — caller
 *               doesn't get to know). Same response for valid-but-non-
 *               existent emails AND rate-limited requests.
 *   "invalid" — the email failed to parse. Distinguishable from the
 *               other cases because an attacker probing for account
 *               existence will use valid syntax anyway.
 */
export function requestMagicLink(
  ctx: RequestMagicLinkContext,
  rawEmail: unknown,
): RequestMagicLinkOutcome {
  const email = parseEmail(rawEmail);
  if (email === null) {
    return { status: "invalid" };
  }

  if (!ctx.rateLimiter.isAllowed(email)) {
    ctx.logger.warn({ email }, "magic-link request rate-limited");
    return { status: "sent" };
  }

  const work = dispatchMagicLinkWork(ctx, email).catch((error: unknown) => {
    ctx.logger.error(
      { err: error, email },
      "magic-link background dispatch failed",
    );
  });

  pendingWork.add(work);
  void work.finally(() => pendingWork.delete(work));

  return { status: "sent" };
}

async function dispatchMagicLinkWork(
  ctx: RequestMagicLinkContext,
  email: string,
): Promise<void> {
  const user = await queryFindUserByEmail(ctx.pool, email);

  if (user === null) {
    ctx.logger.info({ email }, "magic-link request for non-existent user");
    return;
  }

  const { plaintext, hash } = generateMagicLinkToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await queryInsertMagicLinkToken(ctx.pool, {
    userId: user.id,
    tokenHash: hash,
    expiresAt,
  });

  const magicLinkUrl = `${ctx.config.app.url}/auth/consume?token=${plaintext}`;
  const message = magicLinkEmail({
    to: user.email,
    from: ctx.config.email.from,
    magicLinkUrl,
  });

  await ctx.transport.send(message);

  ctx.logger.info({ userId: user.id }, "magic-link email dispatched");
}
