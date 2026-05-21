/**
 * Sliding-window rate limiter, keyed by lowercased email.
 *
 * In-memory only — single process, resets on restart. Fits the
 * single-instance MVP target. The reference project does not multi-
 * instance this app; revisit when hosting changes.
 *
 * Default policy: 3 requests per email per 60 seconds.
 */
export type RateLimiter = {
  isAllowed(email: string): boolean;
  reset(): void;
};

export type RateLimiterPolicy = {
  maxRequests: number;
  windowMs: number;
};

export const DEFAULT_REQUEST_POLICY: RateLimiterPolicy = {
  maxRequests: 3,
  windowMs: 60_000,
};

export function createEmailRateLimiter(
  policy: RateLimiterPolicy = DEFAULT_REQUEST_POLICY,
  now: () => number = Date.now,
): RateLimiter {
  const timestamps = new Map<string, number[]>();

  return {
    isAllowed(email: string) {
      const key = email.toLowerCase();
      const current = now();
      const cutoff = current - policy.windowMs;

      const recent = (timestamps.get(key) ?? []).filter((t) => t > cutoff);

      if (recent.length >= policy.maxRequests) {
        timestamps.set(key, recent);
        return false;
      }

      recent.push(current);
      timestamps.set(key, recent);
      return true;
    },

    reset() {
      timestamps.clear();
    },
  };
}

/** Process-wide singleton used by the action handler. */
export const requestRateLimiter = createEmailRateLimiter();
