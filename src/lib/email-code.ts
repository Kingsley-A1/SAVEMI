/**
 * Passwordless member sign-in by emailed 6-digit code.
 *
 * Requesting a code stores only its bcrypt hash against the address. The
 * member account is created the moment the code is proven — never before —
 * so typing someone else's address creates nothing.
 */

import { randomBytes } from "crypto";
import { prisma } from "./db";
import { hashPassword, normalizeName } from "./site-users";
import {
  checkCode,
  codeExpiry,
  generateCode,
  hashCode,
  isWellFormedCode,
  normalizeCode,
} from "./verification-codes";

export async function issueEmailCode(
  email: string,
  name: string | null,
): Promise<string> {
  const code = generateCode();
  const codeHash = await hashCode(code);
  const expiresAt = codeExpiry();

  await prisma.emailCode.upsert({
    where: { email },
    create: { email, name, codeHash, expiresAt },
    update: { name, codeHash, expiresAt, attempts: 0 },
  });

  return code;
}

export interface CodeSignInResult {
  id: string;
  email: string;
  name: string;
}

/**
 * Prove a code and return the member, creating them on first sign-in.
 * Returns null for any failure, including a suspended account.
 */
export async function redeemEmailCode(
  email: string,
  rawCode: string,
): Promise<CodeSignInResult | null> {
  const code = normalizeCode(rawCode);
  if (!isWellFormedCode(code)) return null;

  const stored = await prisma.emailCode.findUnique({ where: { email } });
  if (!stored) return null;

  const result = await checkCode(code, {
    hash: stored.codeHash,
    expiry: stored.expiresAt,
    attempts: stored.attempts,
  });

  if (!result.ok) {
    if (result.reason === "mismatch") {
      await prisma.emailCode
        .update({ where: { email }, data: { attempts: { increment: 1 } } })
        .catch(() => {});
    }
    return null;
  }

  // Single use.
  await prisma.emailCode.delete({ where: { email } }).catch(() => {});

  const existing = await prisma.siteUser.findUnique({ where: { email } });
  if (existing) {
    if (existing.status !== "ACTIVE") return null;
    await prisma.siteUser
      .update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } })
      .catch(() => {});
    return { id: existing.id, email: existing.email, name: existing.name };
  }

  const name =
    (stored.name && normalizeName(stored.name)) || email.split("@")[0] || "Member";

  // Passwordless members still need a hash in the column; this one matches
  // nothing anyone could type. A password can be set later via "Forgot".
  const created = await prisma.siteUser.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(randomBytes(32).toString("hex")),
      lastLoginAt: new Date(),
    },
  });

  return { id: created.id, email: created.email, name: created.name };
}
