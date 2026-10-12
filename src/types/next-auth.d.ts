import type { DefaultSession } from "next-auth";

type SessionRole = "admin" | "user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** "admin" reaches the admin office; "user" is a public member. */
      role: SessionRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: SessionRole;
    /** Unix seconds of the last request; drives the admin idle timeout. */
    lastSeen?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: SessionRole;
    /** Unix seconds of the last request; drives the admin idle timeout. */
    lastSeen?: number;
  }
}
