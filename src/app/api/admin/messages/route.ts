import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { prisma, isDatabaseConfigured } from '../../../../lib/db';

function guardDb() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }
  return null;
}

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

// GET /api/admin/messages — list for admin (all statuses)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true },
  });

  return NextResponse.json(messages);
}

// POST /api/admin/messages — create
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, slug, summary, description, type, status, speaker,
    scriptureReference, eventDate, durationSeconds, mediaKey, coverImageKey } = body as Record<string, string | null | number | undefined>;

  if (!title || !slug || !summary || !description || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const allowedTypes = ['VIDEO', 'AUDIO', 'IMAGE'];
  if (!allowedTypes.includes(String(type))) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  // Ensure slug uniqueness
  const finalSlug = String(slug) || slugify(String(title));

  try {
    const message = await prisma.message.create({
      data: {
        title: String(title),
        slug: finalSlug,
        summary: String(summary),
        description: String(description),
        type: type as 'VIDEO' | 'AUDIO' | 'IMAGE',
        status: (status as 'DRAFT' | 'PUBLISHED') ?? 'DRAFT',
        speaker: speaker ? String(speaker) : null,
        scriptureReference: scriptureReference ? String(scriptureReference) : null,
        eventDate: eventDate ? new Date(String(eventDate)) : null,
        durationSeconds: durationSeconds ? Number(durationSeconds) : null,
        mediaKey: mediaKey ? String(mediaKey) : null,
        coverImageKey: coverImageKey ? String(coverImageKey) : null,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
