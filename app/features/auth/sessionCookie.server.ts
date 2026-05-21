import { createCookie } from "react-router";
import type { ServerConfig } from "~/config/serverConfig.server";

export const SESSION_COOKIE_NAME = "todo_session";

/** 30 days in seconds — sliding window, refreshed on each authenticated request. */
export const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

/**
 * Build the session cookie. The cookie is HMAC-signed (via the `secrets`
 * option) so tampering yields a parse failure rather than a forged token.
 *
 * The cookie carries the plaintext session token (~256-bit base64url
 * string); the DB stores only its SHA-256 hash.
 */
export function buildSessionCookie(config: ServerConfig) {
  return createCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: config.environment === "production",
    maxAge: SESSION_MAX_AGE_S,
    secrets: [config.session.cookieSecret],
  });
}

/** Read the session token from the incoming request, if present and valid. */
export async function readSessionTokenFromRequest(
  config: ServerConfig,
  request: Request,
): Promise<string | null> {
  const cookie = buildSessionCookie(config);
  const value = await cookie.parse(request.headers.get("Cookie"));
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Build a Set-Cookie header that sets the session cookie. */
export function serializeSessionCookie(
  config: ServerConfig,
  token: string,
): Promise<string> {
  return buildSessionCookie(config).serialize(token);
}

/** Build a Set-Cookie header that clears the session cookie. */
export function clearSessionCookieHeader(
  config: ServerConfig,
): Promise<string> {
  return buildSessionCookie(config).serialize("", { maxAge: 0 });
}

const SETUP_COOKIE_NAME = "todo_setup";
const SETUP_MAX_AGE_S = 10 * 60;

/**
 * Short-lived signed cookie carrying the just-consumed magic-link's user
 * id + email localpart, so the workspace-setup page knows whom to create
 * the workspace for without exposing a re-usable session.
 */
export function buildSetupCookie(config: ServerConfig) {
  return createCookie(SETUP_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: config.environment === "production",
    maxAge: SETUP_MAX_AGE_S,
    secrets: [config.session.cookieSecret],
  });
}

export type SetupCookiePayload = {
  userId: string;
  emailLocalpart: string;
};

export function serializeSetupCookie(
  config: ServerConfig,
  payload: SetupCookiePayload,
): Promise<string> {
  return buildSetupCookie(config).serialize(payload);
}

export async function readSetupCookie(
  config: ServerConfig,
  request: Request,
): Promise<SetupCookiePayload | null> {
  const value = await buildSetupCookie(config).parse(
    request.headers.get("Cookie"),
  );
  if (
    value === null ||
    typeof value !== "object" ||
    typeof (value as Record<string, unknown>)["userId"] !== "string" ||
    typeof (value as Record<string, unknown>)["emailLocalpart"] !== "string"
  ) {
    return null;
  }
  return value as SetupCookiePayload;
}

export function clearSetupCookieHeader(config: ServerConfig): Promise<string> {
  return buildSetupCookie(config).serialize("", { maxAge: 0 });
}
