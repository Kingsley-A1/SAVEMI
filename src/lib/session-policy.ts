/**
 * Session lifetimes. Both windows slide: each request renews them, so they
 * measure inactivity, not time since sign-in.
 */

/** Members stay signed in for 30 days of inactivity. */
export const MEMBER_SESSION_SECONDS = 60 * 60 * 24 * 30;
/** Admins keep the stricter 8-hour idle window they have always had. */
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8;

export interface SessionToken {
  role?: "admin" | "user";
  lastSeen?: number;
}

/**
 * Apply the idle policy to a token on each request. Returns null when the
 * session has expired for its role — the caller signs the visitor out.
 */
export function applyIdlePolicy<T extends SessionToken>(token: T, now: number): T | null {
  if (
    token.role === "admin" &&
    typeof token.lastSeen === "number" &&
    now - token.lastSeen > ADMIN_SESSION_SECONDS
  ) {
    return null;
  }

  token.lastSeen = now;
  return token;
}
