/**
 * Lightweight sliding-window rate limiter backed by a Node.js in-memory Map.
 *
 * Suitable for single-instance deployments (Railway, Vercel serverless warm
 * instances). The window resets on cold starts, which is an acceptable trade-
 * off — the primary goal is reducing automated abuse, not forensic blocking.
 *
 * Usage:
 *   const limiter = new RateLimiter({ windowMs: 15 * 60_000, max: 10 });
 *   const result  = limiter.check("ip:endpoint-key");
 *   if (!result.allowed) return tooManyRequests(result.retryAfterMs);
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Milliseconds until the window resets (only meaningful when !allowed). */
  retryAfterMs: number;
}

interface WindowEntry {
  count: number;
  resetAt: number; // epoch ms
}

export class RateLimiter {
  private readonly windowMs: number;
  private readonly max: number;
  private readonly store = new Map<string, WindowEntry>();

  constructor({ windowMs, max }: { windowMs: number; max: number }) {
    this.windowMs = windowMs;
    this.max = max;
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      // First hit in this window (or stale window — reset it).
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.max - 1, retryAfterMs: 0 };
    }

    entry.count += 1;

    if (entry.count > this.max) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: entry.resetAt - now,
      };
    }

    return {
      allowed: true,
      remaining: this.max - entry.count,
      retryAfterMs: 0,
    };
  }
}

/** Helper: build a standard 429 response with a Retry-After header. */
export function rateLimitResponse(retryAfterMs: number): Response {
  const retryAfterSeconds = Math.ceil(retryAfterMs / 1_000);
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please wait before trying again.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

/** Extract the best available client IP from Next.js request headers. */
export function getClientIp(request: Request): string {
  const headers = new Headers((request as Request).headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

// ---------------------------------------------------------------------------
// Pre-configured limiters for each protected endpoint.
// ---------------------------------------------------------------------------

/** Login: 10 attempts per 15 minutes per IP. */
export const loginLimiter = new RateLimiter({
  windowMs: 15 * 60_000,
  max: 10,
});

/** Admin registration: 5 attempts per hour per IP. */
export const registerLimiter = new RateLimiter({
  windowMs: 60 * 60_000,
  max: 5,
});

/** Contact form: 5 submissions per 10 minutes per IP. */
export const contactLimiter = new RateLimiter({
  windowMs: 10 * 60_000,
  max: 5,
});
