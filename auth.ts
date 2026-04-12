import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import {
  getConfiguredAdminAccessCode,
  hashAdminAccessCode,
  normalizeAdminEmail,
} from "./src/lib/admin-access";
import { prisma } from "./src/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const configuredCode = getConfiguredAdminAccessCode();

        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string" ||
          !configuredCode
        ) {
          return null;
        }

        if (credentials.password !== configuredCode) {
          return null;
        }

        const email = normalizeAdminEmail(credentials.email);

        let admin;
        try {
          admin = await prisma.adminUser.findUnique({
            where: { email },
          });
        } catch {
          return null;
        }

        if (!admin) {
          return null;
        }

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

        return { id: admin.id, email: admin.email, name: admin.name };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 hours
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
  trustHost: true,
});
