import { generateOpaqueToken, hashToken } from "./hashToken.server";

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
  return generateOpaqueToken();
}

export function hashMagicLinkToken(plaintext: string): string {
  return hashToken(plaintext);
}
