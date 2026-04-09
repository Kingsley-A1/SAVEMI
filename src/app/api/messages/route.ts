import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '../../../lib/db';
import { getMessages, type MessageType } from '../../../lib/messages';

function parseLimit(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return Math.min(parsed, 50);
}

function parseType(value: string | null): MessageType | undefined {
  if (value === 'video' || value === 'audio' || value === 'image') {
    return value;
  }

  return undefined;
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Message data is not available until the database is configured.' },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const messages = await getMessages({
    limit: parseLimit(searchParams.get('limit')),
    search: searchParams.get('search')?.trim() || undefined,
    category: searchParams.get('category')?.trim() || undefined,
    speaker: searchParams.get('speaker')?.trim() || undefined,
    type: parseType(searchParams.get('type')),
  });

  return NextResponse.json({
    data: messages,
    meta: {
      count: messages.length,
    },
  });
}