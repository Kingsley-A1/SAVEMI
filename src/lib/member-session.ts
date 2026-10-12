import { auth } from "../../auth";
import { prisma } from "./db";

export interface ActiveMember {
  id: string;
  name: string;
}

/**
 * The signed-in public member, re-checked against the database so a
 * suspension takes effect on the very next action, not at token expiry.
 */
export async function getActiveMember(): Promise<ActiveMember | null> {
  const session = await auth().catch(() => null);
  if (!session?.user?.id || session.user.role !== "user") return null;

  const member = await prisma.siteUser
    .findUnique({ where: { id: session.user.id }, select: { id: true, name: true, status: true } })
    .catch(() => null);

  return member && member.status === "ACTIVE" ? { id: member.id, name: member.name } : null;
}

export const SIGN_IN_REQUIRED = { error: "Sign in to continue.", code: "SIGN_IN_REQUIRED" };
