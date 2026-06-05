import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma, isDatabaseConfigured } from "../../../../../lib/db";
import { audit } from "../../../../../lib/audit";
import { createUniqueMessageSlug } from "../../../../../lib/slugs";

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
    externalMediaUrl,
  } = body as Record<string, string | null | number | undefined>;

  if (placement === "HERO") {
    return NextResponse.json(
      { error: "Hero placement has been retired. Save this as a standard message instead." },
      { status: 400 },
    );
  }

  if (placement !== undefined && placement !== null && placement !== "STANDARD") {
    return NextResponse.json({ error: "Invalid placement" }, { status: 400 });
  }

  try {
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const willPublish =
      status === "PUBLISHED" && existing.status !== "PUBLISHED";
    const nextSlug =
      title !== undefined
        ? await createUniqueMessageSlug(String(title), id)
        : undefined;
    const nextTitle = title !== undefined ? String(title) : existing.title;
    const nextSummary =
      summary !== undefined
        ? summary
          ? String(summary)
          : nextTitle
        : undefined;
    const nextDescription =
      description !== undefined
        ? description
          ? String(description)
          : nextSummary ?? existing.summary
        : undefined;

    const message = await prisma.message.update({
      where: { id },
      data: {
        ...(title && { title: nextTitle }),
        ...(nextSlug && { slug: nextSlug }),
        ...(nextSummary !== undefined && { summary: nextSummary }),
        ...(nextDescription !== undefined && { description: nextDescription }),
        ...(type && { type: type as "VIDEO" | "AUDIO" | "IMAGE" }),
        placement: "STANDARD",
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
        ...(externalMediaUrl !== undefined && {
          externalMediaUrl: externalMediaUrl ? String(externalMediaUrl) : null,
        }),
        ...(willPublish && { publishedAt: new Date() }),
      },
    });

    // Audit: record message update.
    await audit({
      session,
      request: req,
      action: "message.update",
      entityType: "Message",
      entityId: message.id,
      detail: { title: message.title, status: message.status, placement: message.placement },
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
    const deleted = await prisma.message.findUnique({ where: { id }, select: { id: true, title: true } });
    await prisma.message.delete({ where: { id } });

    // Audit: record message deletion.
    await audit({
      session,
      request: _req,
      action: "message.delete",
      entityType: "Message",
      entityId: id,
      detail: { title: deleted?.title },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 },
    );
  }
}
