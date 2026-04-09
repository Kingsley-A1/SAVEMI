import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../auth';
import { prisma, isDatabaseConfigured } from '../../../../../lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function guardDb() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }
  return null;
}

// PATCH /api/admin/messages/:id — update
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, slug, summary, description, type, status, speaker,
    scriptureReference, eventDate, durationSeconds } = body as Record<string, string | null | number | undefined>;

  try {
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const willPublish = status === 'PUBLISHED' && existing.status !== 'PUBLISHED';

    const message = await prisma.message.update({
      where: { id },
      data: {
        ...(title && { title: String(title) }),
        ...(slug && { slug: String(slug) }),
        ...(summary && { summary: String(summary) }),
        ...(description && { description: String(description) }),
        ...(type && { type: type as 'VIDEO' | 'AUDIO' | 'IMAGE' }),
        ...(status && { status: status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }),
        ...(speaker !== undefined && { speaker: speaker ? String(speaker) : null }),
        ...(scriptureReference !== undefined && { scriptureReference: scriptureReference ? String(scriptureReference) : null }),
        ...(eventDate !== undefined && { eventDate: eventDate ? new Date(String(eventDate)) : null }),
        ...(durationSeconds !== undefined && { durationSeconds: durationSeconds ? Number(durationSeconds) : null }),
        ...(willPublish && { publishedAt: new Date() }),
      },
    });

    return NextResponse.json(message);
  } catch {
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

// DELETE /api/admin/messages/:id — delete
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  const { id } = await params;

  try {
    await prisma.message.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
