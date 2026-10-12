/**
 * Comment moderation rules — pure, so they are easy to test and reason about.
 *
 * Comments appear immediately. A few signals hold a comment for an admin
 * instead; its author still sees it, marked as awaiting review.
 */

export const COMMENT_MAX_LENGTH = 1500;
/** Reports from this many different members hold a live comment. */
export const REPORT_HOLD_THRESHOLD = 3;

const LINK_PATTERN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|ng|io|co|info|xyz|link|ly)\b)/i;

export function normalizeCommentBody(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, COMMENT_MAX_LENGTH);
}

export interface HoldDecision {
  status: "VISIBLE" | "HELD";
  reason: string | null;
}

export function decideCommentStatus(input: {
  body: string;
  /** The author has at least one approved comment already. */
  hasApprovedBefore: boolean;
}): HoldDecision {
  if (LINK_PATTERN.test(input.body)) return { status: "HELD", reason: "link" };
  if (!input.hasApprovedBefore) return { status: "HELD", reason: "first comment" };
  return { status: "VISIBLE", reason: null };
}
