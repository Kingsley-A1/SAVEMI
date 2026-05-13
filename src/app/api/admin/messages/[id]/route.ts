import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma, isDatabaseConfigured } from "../../../../../lib/db";

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

function normalizePlacementForType(
  placement: string | null | undefined,
  type: string | null | undefined,
) {
  const nextPlacement = placement ?? undefined;
  const nextType = type ?? undefined;

  if (nextType === "AUDIO") {
    return "STANDARD" as const;
  }

  if (nextPlacement === "HERO" || nextPlacement === "STANDARD") {
    return nextPlacement;
  }

  return undefined;
}

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

// PATCH /api/admin/messages/:id — update
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  const { id } = await params;

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

  if (placement === "HERO" && type === "AUDIO") {
    return NextResponse.json(
      { error: "Hero media must be a video or image." },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const willPublish =
      status === "PUBLISHED" && existing.status !== "PUBLISHED";
    const nextType = type ? String(type) : existing.type;
    const nextStatus = status ? String(status) : existing.status;
    const nextPlacement =
      normalizePlacementForType(
        placement ? String(placement) : existing.placement,
        nextType,
      ) ?? existing.placement;

    const message = await prisma.$transaction(async (tx) => {
      const updated = await tx.message.update({
        where: { id },
        data: {
          ...(title && { title: String(title) }),
          ...(slug && { slug: String(slug) }),
          ...(summary && { summary: String(summary) }),
          ...(description && { description: String(description) }),
          ...(type && { type: type as "VIDEO" | "AUDIO" | "IMAGE" }),
          placement: nextPlacement as "STANDARD" | "HERO",
          ...(status && {
            status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
          }),
          ...(speaker !== undefined && {
            speaker: speaker ? String(speaker) : null,
          }),
          ...(scriptureReference !== undefined && {
            scriptureReference: scriptureReference
              ? String(scriptureReference)
              : null,
          }),
          ...(eventDate !== undefined && {
            eventDate: eventDate ? new Date(String(eventDate)) : null,
          }),
          ...(durationSeconds !== undefined && {
            durationSeconds: parseDurationSeconds(durationSeconds),
          }),
          ...(mediaKey !== undefined && {
            mediaKey: mediaKey ? String(mediaKey) : null,
          }),
          ...(coverImageKey !== undefined && {
            coverImageKey: coverImageKey ? String(coverImageKey) : null,
          }),
          ...(willPublish && { publishedAt: new Date() }),
        },
      });

      if (nextPlacement === "HERO" && nextStatus === "PUBLISHED") {
        await tx.message.updateMany({
          where: {
            id: { not: updated.id },
            placement: "HERO",
            status: "PUBLISHED",
          },
          data: {
            placement: "STANDARD",
          },
        });
      }

      return updated;
    });

    return NextResponse.json(serializeMessage(message));
  } catch {
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/messages/:id — delete
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  const { id } = await params;

  try {
    await prisma.message.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 },
    );
  }
}
