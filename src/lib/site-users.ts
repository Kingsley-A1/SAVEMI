/**
 * Public site members.
 *
 * These accounts sit alongside AdminUser in the same NextAuth session but
 * carry `role: "user"` and never gain admin rights — route protection keys
 * off that role, so the distinction is enforced, not merely implied.
 */

import bcrypt from "bcryptjs";

export const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Returns an error message, or null when the password is acceptable. */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Include at least one letter and one number.";
  }

  return null;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/** Tidy a submitted display name. */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 80);
}
