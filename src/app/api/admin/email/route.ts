import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../lib/db";

/** List sent-email history for the Compose Email admin page, newest first. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized. Admin session required." },
      { status: 401 },
    );
  }

  const history = await prisma.sentEmail.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ data: history });
}
