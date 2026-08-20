/**
 * In-process sliding-window rate limiter.
 *
 * LIMITATION (documented in docs/SECURITY_MODEL.md): state is per-process, so
 * limits apply per instance. For multi-instance deployments move this behind a
 * shared store (e.g. Redis) — the call sites only use `checkRateLimit`, so the
 * implementation can be swapped without touching callers.
 */

type Window = { timestamps: number[] };

const windows = new Map<string, Window>();
let lastSweep = Date.now();

export type RateLimitRule = { limit: number; windowMs: number };

export const RATE_LIMITS = {
  /** Login attempts per IP+email. */
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  /** Account creation per IP. */
  register: { limit: 10, windowMs: 60 * 60 * 1000 },
  /** Password-reset requests per IP. */
  passwordReset: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Elder-screen code lookups per IP (brute-force protection). */
  elderLookup: { limit: 10, windowMs: 10 * 60 * 1000 },
  /** SOS raise per IP — generous: never block a real emergency retry. */
  sos: { limit: 10, windowMs: 60 * 1000 },
} satisfies Record<string, RateLimitRule>;

/** Returns true when the call is allowed; false when rate-limited. */
export function checkRateLimit(key: string, rule: RateLimitRule): boolean {
  const now = Date.now();

  // Occasional sweep so abandoned keys don't accumulate.
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, w] of windows) {
      if (w.timestamps.every((t) => now - t > rule.windowMs)) windows.delete(k);
    }
  }

  const window = windows.get(key) ?? { timestamps: [] };
  window.timestamps = window.timestamps.filter((t) => now - t < rule.windowMs);
  if (window.timestamps.length >= rule.limit) {
    windows.set(key, window);
    return false;
  }
  window.timestamps.push(now);
  windows.set(key, window);
  return true;
}

/** Test helper — clears all limiter state. */
export function resetRateLimits(): void {
  windows.clear();
}
