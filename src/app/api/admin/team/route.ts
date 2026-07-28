import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { isDatabaseConfigured, prisma } from "../../../../lib/db";
import { audit } from "../../../../lib/audit";
import { createUniqueTeamMemberSlug } from "../../../../lib/slugs";
import { isTeamRole } from "../../../../lib/team";

function guardDb() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }
  return null;
}

/** Trim a string field, returning null when it is absent or blank. */
function optional(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// GET /api/admin/team — every member, all statuses.
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guard = guardDb();
  if (guard) return guard;

  try {
    const members = await prisma.teamMember.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(members);
  } catch {
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}

// POST /api/admin/team — create a member.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guard = guardDb();
  if (guard) return guard;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = optional(body.name);
  const title = optional(body.title);

  if (!name || !title) {
    return NextResponse.json(
      { error: "Name and title are required." },
      { status: 422 },
    );
  }

  const role = isTeamRole(body.role) ? body.role : "MEMBER";
  const status =
    body.status === "PUBLISHED"
      ? "PUBLISHED"
      : body.status === "ARCHIVED"
        ? "ARCHIVED"
        : "DRAFT";

  const sortOrder =
    typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
      ? Math.trunc(body.sortOrder)
      : 0;

  try {
    const slug = await createUniqueTeamMemberSlug(name);

    const member = await prisma.teamMember.create({
      data: {
        slug,
        name,
        title,
        role,
        status,
        sortOrder,
        bio: optional(body.bio),
        photoKey: optional(body.photoKey),
        email: optional(body.email),
        phone: optional(body.phone),
        facebookUrl: optional(body.facebookUrl),
        youtubeUrl: optional(body.youtubeUrl),
        whatsappNumber: optional(body.whatsappNumber),
        scriptureVerse: optional(body.scriptureVerse),
        scriptureReference: optional(body.scriptureReference),
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    await audit({
      session,
      request: req,
      action: "team.create",
      entityType: "TeamMember",
      entityId: member.id,
      detail: { name: member.name, role: member.role, status: member.status },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "A team member with that name already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create team member." },
      { status: 500 },
    );
  }
}
