import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "../../../../lib/db";
import { sendWelcomeEmail } from "../../../../lib/admin-verification";
import { getSiteUrl } from "../../../../lib/site-url";

/**
 * Confirms an admin's email from the link in their verification email.
 *   GET /api/admin/verify?token=<token>
 * On success the admin is marked verified, a welcome email is sent, and the
 * browser is redirected to the login page with a success banner.
 */
export async function GET(request: Request) {
  const siteUrl = getSiteUrl(request);
  const loginUrl = new URL("/admin/login", siteUrl);

  if (!isDatabaseConfigured()) {
    loginUrl.searchParams.set("verifyError", "1");
    return NextResponse.redirect(loginUrl);
  }

  const token = new URL(request.url).searchParams.get("token")?.trim();

  if (!token) {
    loginUrl.searchParams.set("verifyError", "1");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { verifyToken: token },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        verifyTokenExpiry: true,
      },
    });

    if (!admin) {
      loginUrl.searchParams.set("verifyError", "1");
      return NextResponse.redirect(loginUrl);
    }

    // Already verified — treat as success (idempotent link).
    if (admin.emailVerified) {
      loginUrl.searchParams.set("verified", "1");
      return NextResponse.redirect(loginUrl);
    }

    if (admin.verifyTokenExpiry && admin.verifyTokenExpiry.getTime() < Date.now()) {
      loginUrl.searchParams.set("verifyExpired", "1");
      return NextResponse.redirect(loginUrl);
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        emailVerified: new Date(),
        verifyToken: null,
        verifyTokenExpiry: null,
      },
    });

    await sendWelcomeEmail({
      to: admin.email,
      name: admin.name,
      loginUrl: `${siteUrl}/admin/login`,
    });

    loginUrl.searchParams.set("verified", "1");
    return NextResponse.redirect(loginUrl);
  } catch {
    loginUrl.searchParams.set("verifyError", "1");
    return NextResponse.redirect(loginUrl);
  }
}
