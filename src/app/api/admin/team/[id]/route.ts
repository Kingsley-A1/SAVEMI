import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { isDatabaseConfigured, prisma } from "../../../../../lib/db";
import { audit } from "../../../../../lib/audit";
import { createUniqueTeamMemberSlug } from "../../../../../lib/slugs";
import { isTeamRole } from "../../../../../lib/team";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function guardDb() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }
  return null;
}

function optional(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// PATCH /api/admin/team/:id — update a member.
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guard = guardDb();
  if (guard) return guard;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = optional(body.name);
  const title = optional(body.title);

  if (body.name !== undefined && !name) {
    return NextResponse.json({ error: "Name is required." }, { status: 422 });
  }

  if (body.title !== undefined && !title) {
    return NextResponse.json({ error: "Title is required." }, { status: 422 });
  }

  const status =
    body.status === "PUBLISHED"
      ? "PUBLISHED"
      : body.status === "ARCHIVED"
        ? "ARCHIVED"
        : body.status === "DRAFT"
          ? "DRAFT"
          : undefined;

  // Stamp publishedAt only on the transition into PUBLISHED.
  let publishedAt: Date | null | undefined;
  if (status === "PUBLISHED") {
    const existing = await prisma.teamMember.findUnique({
      where: { id },
      select: { status: true },
    });
    if (existing && existing.status !== "PUBLISHED") {
      publishedAt = new Date();
    }
  }

  const nextSlug = name
    ? await createUniqueTeamMemberSlug(name, id)
    : undefined;

  try {
    const updated = await prisma.teamMember.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(nextSlug && { slug: nextSlug }),
        ...(title && { title }),
        ...(isTeamRole(body.role) && { role: body.role }),
        ...(status && { status }),
        ...(typeof body.sortOrder === "number" &&
          Number.isFinite(body.sortOrder) && {
            sortOrder: Math.trunc(body.sortOrder),
          }),
        ...(body.bio !== undefined && { bio: optional(body.bio) }),
        ...(body.photoKey !== undefined && {
          photoKey: optional(body.photoKey),
        }),
        ...(body.email !== undefined && { email: optional(body.email) }),
        ...(body.phone !== undefined && { phone: optional(body.phone) }),
        ...(body.facebookUrl !== undefined && {
          facebookUrl: optional(body.facebookUrl),
        }),
        ...(body.youtubeUrl !== undefined && {
          youtubeUrl: optional(body.youtubeUrl),
        }),
        ...(body.whatsappNumber !== undefined && {
          whatsappNumber: optional(body.whatsappNumber),
        }),
        ...(body.scriptureVerse !== undefined && {
          scriptureVerse: optional(body.scriptureVerse),
        }),
        ...(body.scriptureReference !== undefined && {
          scriptureReference: optional(body.scriptureReference),
        }),
        ...(publishedAt !== undefined && { publishedAt }),
      },
    });

    await audit({
      session,
      request: req,
      action: "team.update",
      entityType: "TeamMember",
      entityId: updated.id,
      detail: { name: updated.name, role: updated.role, status: updated.status },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (code === "P2002") {
      return NextResponse.json(
        { error: "A team member with that name already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update team member." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/team/:id
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guard = guardDb();
  if (guard) return guard;

  const { id } = await params;

  try {
    const existing = await prisma.teamMember.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    await prisma.teamMember.delete({ where: { id } });

    await audit({
      session,
      request: req,
      action: "team.delete",
      entityType: "TeamMember",
      entityId: id,
      detail: { name: existing?.name },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete team member." },
      { status: 500 },
    );
  }
}
