import { describe, expect, test } from "vitest";
import { z } from "zod";
import { getServerConfig } from "~/config/serverConfig.server";
import { sql } from "~/database/sql.server";
import { hashToken } from "~/features/auth/hashToken.server";
import {
  readSession,
  requireSession,
} from "~/features/auth/requireSession.server";
import {
  buildSessionCookie,
  SESSION_MAX_AGE_S,
} from "~/features/auth/sessionCookie.server";
import { createTestPool } from "~/test/database/createTestPool";

const userRow = z.strictObject({ id: z.string().uuid() });
const wsRow = z.strictObject({ id: z.string().uuid() });
const sessionExpiryRow = z.strictObject({ expires_at: z.number() });

async function seedSession(): Promise<{ token: string; expiresInit: number }> {
  const pool = await createTestPool();
  const user = await pool.one(
    sql.type(
      userRow,
    )`INSERT INTO users (email) VALUES ('rs@example.com') RETURNING id`,
  );
  const ws = await pool.one(
    sql.type(
      wsRow,
    )`INSERT INTO workspaces (name) VALUES ('rs ws') RETURNING id`,
  );
  await pool.query(
    sql.typeAlias("void")`
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES (${ws.id}, ${user.id}, 'admin')
    `,
  );
  // biome-ignore lint/security/noSecrets: Synthetic test fixture, not a real session token.
  const token = "test-session-plaintext-token-1234567890abcdef";
  const hash = hashToken(token);
  // Past expiry far enough to detect refresh extending it.
  const expiresInit = Date.now() + 60 * 1000;
  await pool.query(
    sql.typeAlias("void")`
      INSERT INTO sessions (user_id, workspace_id, token_hash, expires_at)
      VALUES (${user.id}, ${ws.id}, ${hash}, ${new Date(expiresInit).toISOString()})
    `,
  );
  return { token, expiresInit };
}

async function buildRequestWithSessionCookie(token: string): Promise<Request> {
  const config = getServerConfig();
  const setCookie = await buildSessionCookie(config).serialize(token);
  // setCookie is the full Set-Cookie header — strip attributes for Cookie.
  const cookieValue = setCookie.split(";")[0] ?? "";
  return new Request("http://localhost/board", {
    headers: {
      // biome-ignore lint/style/useNamingConvention: HTTP header name is "Cookie" by RFC.
      Cookie: cookieValue,
    },
  });
}

describe("requireSession / readSession", () => {
  test("readSession returns null when no cookie is present", async () => {
    const config = getServerConfig();
    const req = new Request("http://localhost/board");

    expect(await readSession(config, req)).toBeNull();
  });

  test("readSession returns null for a token that doesn't match a row", async () => {
    const config = getServerConfig();
    const req = await buildRequestWithSessionCookie("not-a-real-token");

    expect(await readSession(config, req)).toBeNull();
  });

  test("requireSession returns branded session and slides expiry forward", async () => {
    const config = getServerConfig();
    const { token, expiresInit } = await seedSession();
    const req = await buildRequestWithSessionCookie(token);

    const session = await requireSession(config, req);

    expect(session.role).toBe("admin");
    expect(typeof session.userId).toBe("string");
    expect(typeof session.workspaceId).toBe("string");

    const pool = await createTestPool();
    const rows = await pool.any(
      sql.type(sessionExpiryRow)`SELECT expires_at FROM sessions`,
    );
    const newExpiry = rows[0]?.expires_at ?? 0;
    expect(newExpiry).toBeGreaterThan(expiresInit);
    // New expiry should be close to now + SESSION_MAX_AGE_S.
    const target = Date.now() + SESSION_MAX_AGE_S * 1000;
    expect(Math.abs(newExpiry - target)).toBeLessThan(5_000);
  });

  test("requireSession throws a redirect Response for unauthenticated requests", async () => {
    const config = getServerConfig();
    const req = new Request("http://localhost/board");

    await expect(requireSession(config, req)).rejects.toMatchObject({
      status: 302,
      headers: expect.any(Headers),
    });
  });
});
