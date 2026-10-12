import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import {
  getConfiguredAdminAccessCode,
  hashAdminAccessCode,
  normalizeAdminEmail,
} from "./src/lib/admin-access";
import { verifyPassword } from "./src/lib/site-users";
import { prisma } from "./src/lib/db";
import { redeemEmailCode } from "./src/lib/email-code";
import { codeVerifyLimiter, getClientIp } from "./src/lib/rate-limit";
import { applyIdlePolicy, MEMBER_SESSION_SECONDS } from "./src/lib/session-policy";

export type SessionRole = "admin" | "user";

interface AuthorizedUser {
  id: string;
  email: string;
  name: string;
  role: SessionRole;
}

/**
 * Admin sign-in: the shared ministry access code, matched against a
 * registered AdminUser. Unchanged behaviour — including the self-heal that
 * re-hashes a stored password when the configured code has been rotated.
 */
async function authorizeAdmin(
  email: string,
  password: string,
): Promise<AuthorizedUser | null> {
  const configuredCode = getConfiguredAdminAccessCode();

  if (!configuredCode || password !== configuredCode) {
    return null;
  }

  let admin;
  try {
    admin = await prisma.adminUser.findUnique({ where: { email } });
  } catch {
    return null;
  }

  if (!admin) return null;

  const storedHashMatches = await bcrypt.compare(
    configuredCode,
    admin.passwordHash,
  );

  if (!storedHashMatches) {
    const passwordHash = await hashAdminAccessCode();
    try {
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { passwordHash },
      });
    } catch {
      return null;
    }
  }

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: "admin",
  };
}

/** Public member sign-in: a personal bcrypt password. */
async function authorizeSiteUser(
  email: string,
  password: string,
): Promise<AuthorizedUser | null> {
  let user;
  try {
    user = await prisma.siteUser.findUnique({ where: { email } });
  } catch {
    return null;
  }

  if (!user || user.status !== "ACTIVE") return null;

  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) return null;

  // Best-effort: a failed timestamp write must never block a valid sign-in.
  try {
    await prisma.siteUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  } catch {
    // Ignored.
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: "user",
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const email = normalizeAdminEmail(credentials.email);
        const { password } = credentials;

        // Admin first: the shared code is checked before any password hash,
        // so an admin address never falls through to the member table.
        return (
          (await authorizeAdmin(email, password)) ??
          (await authorizeSiteUser(email, password))
        );
      },
    }),
    // Passwordless members: an emailed 6-digit code, no password at all.
    Credentials({
      id: "email-code",
      name: "email-code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials, request) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.code !== "string"
        ) {
          return null;
        }

        // Outer wall on guessing; each code also dies after 5 wrong tries.
        const ip = request ? getClientIp(request) : "unknown";
        if (!codeVerifyLimiter.check(`email-code:${ip}`).allowed) return null;

        try {
          const user = await redeemEmailCode(
            normalizeAdminEmail(credentials.email),
            credentials.code,
          );
          return user ? { ...user, role: "user" as const } : null;
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    // The cookie lives as long as the longest role allows; the jwt callback
    // below cuts admin sessions short. Both windows slide with activity.
    maxAge: MEMBER_SESSION_SECONDS,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: SessionRole }).role ?? "user";
      }

      // Null ends the session and clears the cookie.
      return applyIdlePolicy<JWT>(token, Math.floor(Date.now() / 1000));
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as SessionRole) ?? "user";
      }
      return session;
    },
  },
  trustHost: true,
});
