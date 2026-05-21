import { createHash, randomBytes } from "node:crypto";

/**
 * Hash an opaque high-entropy token with SHA-256.
 *
 * Used for both magic-link tokens and session tokens. The plaintext lives
 * only in the email link / cookie; the DB stores only the hash.
 */
export function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/** Generate a 32-byte (~256-bit) base64url token. */
export function generateOpaqueToken(): { plaintext: string; hash: string } {
  const plaintext = randomBytes(32).toString("base64url");
  return { plaintext, hash: hashToken(plaintext) };
}
