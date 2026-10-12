import { randomBytes } from "crypto";
import { auth } from "../../auth";
import { prisma } from "./db";
import { hashPassword } from "./site-users";

export interface ActiveMember {
  id: string;
  name: string;
  /** Signed in through the admin office — trusted, and not audience data. */
  isAdmin: boolean;
}

/**
 * Comments and likes belong to a SiteUser row. An admin has none of their
 * own, so the first time they engage we give them one on their admin email.
 * It can never be signed into as a member: sign-in checks the admin branch
 * first for that address, and its password hash matches nothing.
 */
async function adminProfile(email: string, name: string): Promise<ActiveMember | null> {
  const existing = await prisma.siteUser.findUnique({
    where: { email },
    select: { id: true, name: true },
  });
  if (existing) return { id: existing.id, name: existing.name, isAdmin: true };

  const created = await prisma.siteUser.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(randomBytes(32).toString("hex")),
    },
    select: { id: true, name: true },
  });
  return { id: created.id, name: created.name, isAdmin: true };
}

/**
 * The signed-in person who may like and comment — a public member or an
 * admin — re-checked against the database so a suspension or a removed
 * admin takes effect on the very next action, not at token expiry.
 */
export async function getActiveMember(): Promise<ActiveMember | null> {
  const session = await auth().catch(() => null);
  const user = session?.user;
  if (!user?.id) return null;

  try {
    if (user.role === "admin") {
      const admin = await prisma.adminUser.findUnique({
        where: { id: user.id },
        select: { email: true, name: true },
      });
      return admin ? await adminProfile(admin.email, admin.name) : null;
    }

    const member = await prisma.siteUser.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, status: true },
    });
    return member && member.status === "ACTIVE"
      ? { id: member.id, name: member.name, isAdmin: false }
      : null;
  } catch {
    return null;
  }
}

export const SIGN_IN_REQUIRED = { error: "Sign in to continue.", code: "SIGN_IN_REQUIRED" };
