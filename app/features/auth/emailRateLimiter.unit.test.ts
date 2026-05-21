import { beforeEach, describe, expect, test } from "vitest";
import { createEmailRateLimiter } from "./emailRateLimiter";

describe("emailRateLimiter", () => {
  let clock: number;
  const now = () => clock;

  beforeEach(() => {
    clock = 1000;
  });

  test("allows the first N requests within the window", () => {
    const rl = createEmailRateLimiter(
      { maxRequests: 3, windowMs: 60_000 },
      now,
    );

    expect(rl.isAllowed("a@example.com")).toBe(true);
    expect(rl.isAllowed("a@example.com")).toBe(true);
    expect(rl.isAllowed("a@example.com")).toBe(true);
  });

  test("blocks the N+1th request within the window", () => {
    const rl = createEmailRateLimiter(
      { maxRequests: 3, windowMs: 60_000 },
      now,
    );

    rl.isAllowed("a@example.com");
    rl.isAllowed("a@example.com");
    rl.isAllowed("a@example.com");

    expect(rl.isAllowed("a@example.com")).toBe(false);
  });

  test("allows again after the window slides past", () => {
    const rl = createEmailRateLimiter(
      { maxRequests: 3, windowMs: 60_000 },
      now,
    );

    rl.isAllowed("a@example.com");
    rl.isAllowed("a@example.com");
    rl.isAllowed("a@example.com");
    expect(rl.isAllowed("a@example.com")).toBe(false);

    clock += 60_001;

    expect(rl.isAllowed("a@example.com")).toBe(true);
  });

  test("limits are per-email", () => {
    const rl = createEmailRateLimiter(
      { maxRequests: 1, windowMs: 60_000 },
      now,
    );

    expect(rl.isAllowed("a@example.com")).toBe(true);
    expect(rl.isAllowed("a@example.com")).toBe(false);

    // Different email — fresh bucket.
    expect(rl.isAllowed("b@example.com")).toBe(true);
  });

  test("treats email comparison case-insensitively", () => {
    const rl = createEmailRateLimiter(
      { maxRequests: 1, windowMs: 60_000 },
      now,
    );

    expect(rl.isAllowed("alice@example.com")).toBe(true);
    expect(rl.isAllowed("ALICE@example.com")).toBe(false);
  });

  test("reset clears all buckets", () => {
    const rl = createEmailRateLimiter(
      { maxRequests: 1, windowMs: 60_000 },
      now,
    );

    rl.isAllowed("a@example.com");
    expect(rl.isAllowed("a@example.com")).toBe(false);

    rl.reset();

    expect(rl.isAllowed("a@example.com")).toBe(true);
  });
});
