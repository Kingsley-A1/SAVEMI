import { auth } from "../auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminApiRoute = pathname.startsWith("/api/admin");
  const isAuthRoute =
    pathname.startsWith("/admin/login") || pathname.startsWith("/admin/register");

  // Prevent logged-in admins from accessing the login/register pages
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/admin", req.nextUrl));
    }
    return; // Allow access for unauthenticated users
  }

  // Protect all other admin and API admin routes
  if (isAdminRoute || isAdminApiRoute) {
    if (!isLoggedIn) {
      if (isAdminApiRoute) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return Response.redirect(new URL("/admin/login", req.nextUrl));
    }
  }
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
