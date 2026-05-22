import { auth } from "../auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminApiRoute = pathname.startsWith("/api/admin");
  const isAuthRoute =
    pathname === "/admin/login" ||
    pathname === "/admin/register" ||
    pathname === "/api/admin/register" ||
    pathname.startsWith("/api/auth");

  // Allow login page and auth API through
  // If they are logged in and hit login/register, redirect to dashboard
  if (isAuthRoute) {
    if (isLoggedIn && (pathname === "/admin/login" || pathname === "/admin/register")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // Protect all /admin and /api/admin routes
  if (isAdminRoute || isAdminApiRoute) {
    if (!isLoggedIn) {
      if (isAdminApiRoute) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
