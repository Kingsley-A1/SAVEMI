import { NextResponse } from "next/server";

// P0-1: This public upload-signing endpoint has been removed.
// All upload URL signing now requires an admin session and must go through
// /api/admin/upload-url which is covered by middleware + route-level auth.
export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been removed. Use /api/admin/upload-url instead.",
    },
    { status: 410 },
  );
}
