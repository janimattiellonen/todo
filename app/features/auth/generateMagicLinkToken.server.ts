import { createHash, randomBytes } from "node:crypto";

/**
 * Generate a one-time magic-link token.
 *
 * Returns the plaintext (carried in the email link, never persisted) and
 * its SHA-256 hex hash (persisted, indexed, compared on consume).
 *
 * The token is 32 random bytes → 43 base64url chars: ~256 bits of entropy,
 * collision-resistant under birthday bound, no need for a per-token salt
 * (saltless hashing is standard for high-entropy opaque tokens; bcrypt-
 * style stretching is for low-entropy passwords).
 */
export type GeneratedToken = {
  plaintext: string;
  hash: string;
};

export function generateMagicLinkToken(): GeneratedToken {
  const plaintext = randomBytes(32).toString("base64url");
  const hash = hashMagicLinkToken(plaintext);

  return { plaintext, hash };
}

export function hashMagicLinkToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}
