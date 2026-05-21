import { type NextRequest } from "next/server";
import { handlers } from "../../../../../auth";
import {
  loginLimiter,
  getClientIp,
  rateLimitResponse,
} from "../../../../lib/rate-limit";

/**
 * Auth route — wraps NextAuth handlers.
 *
 * GET  → session checks / sign-out redirects (no rate limit needed).
 * POST → credentials sign-in (rate limited: 10 attempts per 15 min per IP).
 *
 * Note: NextAuth's POST handler only accepts `request` — the catch-all
 * segment params are consumed internally by the library.
 */
export const GET = handlers.GET;

export async function POST(
  request: NextRequest,
  _context: { params: Promise<{ nextauth: string[] }> },
) {
  // Rate limit login attempts: 10 per 15 minutes per IP.
  const ip = getClientIp(request);
  const limit = loginLimiter.check(`login:${ip}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

  // NextAuth only needs the request — delegate to its handler.
  return handlers.POST(request);
}
