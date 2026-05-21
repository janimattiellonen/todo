import { describe, expect, test } from "vitest";
import {
  generateMagicLinkToken,
  hashMagicLinkToken,
} from "./generateMagicLinkToken.server";

describe("generateMagicLinkToken", () => {
  test("plaintext is 43 base64url characters (32 random bytes)", () => {
    const { plaintext } = generateMagicLinkToken();

    expect(plaintext).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  test("hash is 64 hex characters (SHA-256)", () => {
    const { hash } = generateMagicLinkToken();

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test("two generations produce different plaintext and different hash", () => {
    const a = generateMagicLinkToken();
    const b = generateMagicLinkToken();

    expect(a.plaintext).not.toBe(b.plaintext);
    expect(a.hash).not.toBe(b.hash);
  });

  test("hashMagicLinkToken is deterministic for the same input", () => {
    const a = hashMagicLinkToken("known-token");
    const b = hashMagicLinkToken("known-token");

    expect(a).toBe(b);
  });

  // biome-ignore lint/security/noSecrets: Test description, not a secret.
  test("the hash matches hashMagicLinkToken(plaintext)", () => {
    const { plaintext, hash } = generateMagicLinkToken();

    expect(hash).toBe(hashMagicLinkToken(plaintext));
  });
});
