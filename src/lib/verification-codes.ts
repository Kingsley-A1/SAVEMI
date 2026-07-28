/**
 * Shared 6-digit code mechanism for admin email verification and member
 * password reset.
 *
 * A 6-digit code is only a million possibilities, so the design compensates:
 *
 *   - generated with crypto.randomInt, never Math.random
 *   - stored as a bcrypt hash, never in the clear
 *   - short lived (15 minutes)
 *   - dies after MAX_ATTEMPTS wrong guesses, so an attacker gets 5 tries per
 *     issued code rather than unlimited guesses
 *   - callers additionally rate limit by IP
 */

import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

export const CODE_LENGTH = 6;
export const CODE_TTL_MS = 1000 * 60 * 15; // 15 minutes
export const MAX_ATTEMPTS = 5;

/** A cryptographically random 6-digit code, zero-padded. */
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(CODE_LENGTH, "0");
}

export function codeExpiry(): Date {
  return new Date(Date.now() + CODE_TTL_MS);
}

export function hashCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export function compareCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/** Strip spaces and dashes people paste in from their email client. */
export function normalizeCode(input: string): string {
  return input.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

export function isWellFormedCode(input: string): boolean {
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(input);
}

export interface StoredCode {
  hash: string | null;
  expiry: Date | null;
  attempts: number;
}

export type CodeCheck =
  | { ok: true }
  | { ok: false; reason: "missing" | "expired" | "locked" | "mismatch" };

/**
 * Validate a submitted code against what is stored.
 *
 * Returns a coarse reason so callers can decide what to reveal — the public
 * endpoints deliberately collapse most of these into one message.
 */
export async function checkCode(
  submitted: string,
  stored: StoredCode,
): Promise<CodeCheck> {
  if (!stored.hash || !stored.expiry) {
    return { ok: false, reason: "missing" };
  }

  if (stored.expiry.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if (stored.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "locked" };
  }

  const matches = await compareCode(submitted, stored.hash);
  return matches ? { ok: true } : { ok: false, reason: "mismatch" };
}

/** The message shown for every failure mode that isn't a hard lockout. */
export const GENERIC_CODE_ERROR =
  "That code is not valid or has expired. Request a new one.";

export const LOCKED_CODE_ERROR =
  "Too many incorrect attempts. Request a new code to continue.";
