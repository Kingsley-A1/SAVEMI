import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { isDatabaseConfigured, prisma } from "../../../../lib/db";
import {
  hashPassword,
  normalizeName,
  validatePassword,
  verifyPassword,
} from "../../../../lib/site-users";

// PATCH /api/account/profile — a member updates their own name or password.
export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "user") {
    return NextResponse.json(
      { error: "Sign in to update your profile." },
      { status: 401 },
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Profile updates are unavailable right now." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? normalizeName(body.name) : "";
  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";

  if (!name) {
    return NextResponse.json({ error: "Enter your name." }, { status: 422 });
  }

  const wantsPasswordChange = Boolean(newPassword);

  if (wantsPasswordChange) {
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 422 });
    }

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Enter your current password to set a new one." },
        { status: 422 },
      );
    }
  }

  try {
    const user = await prisma.siteUser.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    if (wantsPasswordChange) {
      const matches = await verifyPassword(currentPassword, user.passwordHash);
      if (!matches) {
        return NextResponse.json(
          { error: "Your current password is not correct." },
          { status: 403 },
        );
      }
    }

    const updated = await prisma.siteUser.update({
      where: { id: user.id },
      data: {
        name,
        ...(wantsPasswordChange && {
          passwordHash: await hashPassword(newPassword),
        }),
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({
      data: updated,
      message: wantsPasswordChange
        ? "Profile and password updated."
        : "Profile updated.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to update your profile." },
      { status: 500 },
    );
  }
}
