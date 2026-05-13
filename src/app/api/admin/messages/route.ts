import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma, isDatabaseConfigured } from "../../../../lib/db";

function parseDurationSeconds(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return BigInt(Math.trunc(parsed));
}

function serializeMessage<T extends { durationSeconds?: bigint | null }>(
  message: T,
) {
  return {
    ...message,
    durationSeconds:
      typeof message.durationSeconds === "bigint"
        ? Number(message.durationSeconds)
        : message.durationSeconds ?? null,
  };
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

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

// GET /api/admin/messages — list for admin (all statuses)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return NextResponse.json(messages.map((message) => serializeMessage(message)));
}

// POST /api/admin/messages — create
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    title,
    slug,
    summary,
    description,
    type,
    placement,
    status,
    speaker,
    scriptureReference,
    eventDate,
    durationSeconds,
    mediaKey,
    coverImageKey,
  } = body as Record<string, string | null | number | undefined>;

  if (!title || !slug || !summary || !description || !type) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const allowedTypes = ["VIDEO", "AUDIO", "IMAGE"];
  if (!allowedTypes.includes(String(type))) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const allowedPlacements = ["STANDARD", "HERO"];
  const finalPlacement = String(placement ?? "STANDARD");

  if (!allowedPlacements.includes(finalPlacement)) {
    return NextResponse.json({ error: "Invalid placement" }, { status: 400 });
  }

  if (finalPlacement === "HERO" && type === "AUDIO") {
    return NextResponse.json(
      { error: "Hero media must be a video or image." },
      { status: 400 },
    );
  }

  // Ensure slug uniqueness
  const finalSlug = String(slug) || slugify(String(title));

  try {
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          title: String(title),
          slug: finalSlug,
          summary: String(summary),
          description: String(description),
          type: type as "VIDEO" | "AUDIO" | "IMAGE",
          status: (status as "DRAFT" | "PUBLISHED") ?? "DRAFT",
          placement: finalPlacement as "STANDARD" | "HERO",
          speaker: speaker ? String(speaker) : null,
          scriptureReference: scriptureReference
            ? String(scriptureReference)
            : null,
          eventDate: eventDate ? new Date(String(eventDate)) : null,
          durationSeconds: parseDurationSeconds(durationSeconds),
          mediaKey: mediaKey ? String(mediaKey) : null,
          coverImageKey: coverImageKey ? String(coverImageKey) : null,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
        },
      });

      if (created.placement === "HERO" && created.status === "PUBLISHED") {
        await tx.message.updateMany({
          where: {
            id: { not: created.id },
            placement: "HERO",
            status: "PUBLISHED",
          },
          data: {
            placement: "STANDARD",
          },
        });
      }

      return created;
    });

    return NextResponse.json(serializeMessage(message), { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 },
    );
  }
}
