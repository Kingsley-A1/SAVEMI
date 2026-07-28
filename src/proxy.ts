import { auth } from "../auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  // Public members share the session table with admins, so admin access is
  // gated on the role — being signed in is not by itself enough.
  const isAdmin = req.auth?.user?.role === "admin";

  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminApiRoute = pathname.startsWith("/api/admin");
  const isAccountRoute = pathname.startsWith("/account");
  // Reached before an admin can possibly be signed in, so these stay open.
  const isAuthRoute =
    pathname === "/admin/login" ||
    pathname === "/admin/register" ||
    pathname === "/admin/verify" ||
    pathname === "/api/admin/register" ||
    pathname === "/api/admin/verify" ||
    pathname.startsWith("/api/auth");

  // Allow login page and auth API through.
  // If an admin is already signed in and hits login, send them to the office.
  if (isAuthRoute) {
    if (isAdmin && pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // Member profile: any signed-in account, admin or public.
  if (isAccountRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // The admin office and its API require an admin role.
  if (isAdminRoute || isAdminApiRoute) {
    if (!isAdmin) {
      if (isAdminApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      // A signed-in member is not an admin — send them to their own profile
      // rather than looping them through a login they have already passed.
      if (isLoggedIn) {
        return NextResponse.redirect(new URL("/account", req.url));
      }

      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/account/:path*"],
};
