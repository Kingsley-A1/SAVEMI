import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '../../../../lib/db';
import { getMessageById } from '../../../../lib/messages';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Message data is not available until the database is configured.' },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const message = await getMessageById(id);

  if (!message) {
    return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
  }

  return NextResponse.json({ data: message });
}