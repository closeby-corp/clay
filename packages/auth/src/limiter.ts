export type LoginLimiterOptions = {
  /** Max failed attempts in the window before lockout. Default 5. */
  maxAttempts?: number;
  /** Sliding window length in ms. Default 15 minutes. */
  windowMs?: number;
  /** Lockout duration after max attempts. Default = windowMs. */
  lockoutMs?: number;
};

export type LoginAttemptResult =
  | { ok: true }
  | { ok: false; retryAfterMs: number; attempts: number };

type Bucket = {
  failures: number[];
  lockedUntil?: number;
};

/**
 * In-process login rate limiter (per key, typically `ip:username`).
 * Fine for single-instance demos; use Redis (or similar) for multi-instance prod.
 */
export function createLoginLimiter(options: LoginLimiterOptions = {}) {
  const maxAttempts = options.maxAttempts ?? 5;
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const lockoutMs = options.lockoutMs ?? windowMs;
  const buckets = new Map<string, Bucket>();

  function prune(bucket: Bucket, now: number): void {
    bucket.failures = bucket.failures.filter((t) => now - t < windowMs);
    if (bucket.lockedUntil && bucket.lockedUntil <= now) {
      delete bucket.lockedUntil;
    }
  }

  function get(key: string): Bucket {
    let b = buckets.get(key);
    if (!b) {
      b = { failures: [] };
      buckets.set(key, b);
    }
    return b;
  }

  return {
    /** Check whether a login attempt is allowed right now. */
    check(key: string, now = Date.now()): LoginAttemptResult {
      const bucket = get(key);
      prune(bucket, now);
      if (bucket.lockedUntil && bucket.lockedUntil > now) {
        return {
          ok: false,
          retryAfterMs: bucket.lockedUntil - now,
          attempts: bucket.failures.length,
        };
      }
      return { ok: true };
    },

    /** Record a failed attempt; may engage lockout. */
    fail(key: string, now = Date.now()): LoginAttemptResult {
      const bucket = get(key);
      prune(bucket, now);
      if (bucket.lockedUntil && bucket.lockedUntil > now) {
        return {
          ok: false,
          retryAfterMs: bucket.lockedUntil - now,
          attempts: bucket.failures.length,
        };
      }
      bucket.failures.push(now);
      if (bucket.failures.length >= maxAttempts) {
        bucket.lockedUntil = now + lockoutMs;
        return {
          ok: false,
          retryAfterMs: lockoutMs,
          attempts: bucket.failures.length,
        };
      }
      return {
        ok: false,
        retryAfterMs: 0,
        attempts: bucket.failures.length,
      };
    },

    /** Clear failures after a successful login. */
    success(key: string): void {
      buckets.delete(key);
    },

    /** Test helper. */
    clear(): void {
      buckets.clear();
    },
  };
}

export type LoginLimiter = ReturnType<typeof createLoginLimiter>;
