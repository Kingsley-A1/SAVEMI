import { NextResponse } from "next/server";
import { getHeroMessage } from "../../../../lib/messages";

export async function GET() {
  const message = await getHeroMessage();

  return NextResponse.json({ data: message ?? null });
}