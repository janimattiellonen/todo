import { describe, expect, test } from "vitest";
import { parseEmail } from "./validateEmail";

describe("parseEmail", () => {
  test("accepts a valid email", () => {
    expect(parseEmail("alice@example.com")).toBe("alice@example.com");
  });

  test("lowercases the result", () => {
    expect(parseEmail("Alice@Example.COM")).toBe("alice@example.com");
  });

  test("trims surrounding whitespace", () => {
    expect(parseEmail("  alice@example.com  ")).toBe("alice@example.com");
  });

  test("rejects empty string", () => {
    expect(parseEmail("")).toBeNull();
    expect(parseEmail("   ")).toBeNull();
  });

  test("rejects malformed addresses", () => {
    expect(parseEmail("not-an-email")).toBeNull();
    expect(parseEmail("missing@tld")).toBeNull();
    expect(parseEmail("@example.com")).toBeNull();
  });

  test("rejects non-string input", () => {
    expect(parseEmail(undefined)).toBeNull();
    expect(parseEmail(null)).toBeNull();
    expect(parseEmail(42)).toBeNull();
    expect(parseEmail({})).toBeNull();
  });

  test("rejects emails over 254 chars (RFC 5321 envelope limit)", () => {
    const longLocal = "a".repeat(250);
    const tooLong = `${longLocal}@example.com`;
    expect(parseEmail(tooLong)).toBeNull();
  });
});
