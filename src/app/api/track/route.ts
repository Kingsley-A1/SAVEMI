import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { isDatabaseConfigured } from "../../../lib/db";
import {
  contentFromPath,
  findPublishedContent,
  getRequestContext,
  newVisitorId,
  parseContentKind,
  recordEvent,
  visitorCookie,
} from "../../../lib/engagement";
import { getClientIp, trackLimiter } from "../../../lib/rate-limit";

/**
 * POST /api/track  { type: "view", path } | { type: "play", kind, id }
 *
 * Beacon endpoint for page views and plays. Always answers 204 so a
 * blocked or failed beacon never surfaces to the reader.
 */
export async function POST(request: Request) {
  const done = new NextResponse(null, { status: 204 });
  if (!isDatabaseConfigured()) return done;
  if (!trackLimiter.check(`track:${getClientIp(request)}`).allowed) return done;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return done;

  const context = getRequestContext(request);
  if (context.isBot) return done;

  if (!context.visitorId) {
    context.visitorId = newVisitorId();
    done.headers.append("set-cookie", visitorCookie(context.visitorId));
  }

  const session = await auth().catch(() => null);
  // Admin activity is not audience engagement.
  if (session?.user?.role === "admin") return done;
  const userId = session?.user?.role === "user" ? session.user.id : null;

  if (body.type === "view" && typeof body.path === "string") {
    const path = body.path.split("?")[0].slice(0, 300);
    if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return done;

    const ref = contentFromPath(path);
    const content = ref
      ? await findPublishedContent(ref.kind, ref.idOrSlug).catch(() => null)
      : null;

    await recordEvent({
      type: "VIEW",
      kind: content?.kind ?? null,
      targetId: content?.id ?? null,
      path,
      userId,
      context,
    });
    return done;
  }

  if (body.type === "play" && typeof body.id === "string") {
    const kind = parseContentKind(body.kind);
    const content = kind ? await findPublishedContent(kind, body.id).catch(() => null) : null;
    if (!content) return done;

    await recordEvent({ type: "PLAY", kind: content.kind, targetId: content.id, userId, context });
  }

  return done;
}
