import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import {
  getClientIp,
  rateLimitResponse,
  RateLimiter,
} from "../../../../../lib/rate-limit";
import { isEmailConfigured, sendEmail } from "../../../../../lib/email";
import { renderAdminComposedEmail } from "../../../../../lib/email-templates";

// Composed-email sending: 20 messages per 10 minutes per IP.
const composeLimiter = new RateLimiter({ windowMs: 10 * 60_000, max: 20 });

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseRecipients(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  if (typeof value === "string") {
    return value.split(/[,;\s]+/);
  }
  return [];
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized. Admin session required." },
      { status: 401 },
    );
  }

  const ip = getClientIp(request);
  const limit = composeLimiter.check(`compose:${ip}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email is not configured. Add RESEND_API_KEY and EMAIL_FROM before sending.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const recipients = parseRecipients(body.to)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const uniqueRecipients = Array.from(new Set(recipients));

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const bodyText = typeof body.body === "string" ? body.body.trim() : "";
  const scriptureVerse =
    typeof body.scriptureVerse === "string" ? body.scriptureVerse.trim() : "";
  const scriptureReference =
    typeof body.scriptureReference === "string"
      ? body.scriptureReference.trim()
      : "";

  if (uniqueRecipients.length === 0) {
    return NextResponse.json(
      { error: "Add at least one recipient email address." },
      { status: 422 },
    );
  }

  if (uniqueRecipients.length > 50) {
    return NextResponse.json(
      { error: "Please send to no more than 50 recipients at a time." },
      { status: 422 },
    );
  }

  const invalid = uniqueRecipients.filter((entry) => !isValidEmail(entry));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid email address: ${invalid[0]}` },
      { status: 422 },
    );
  }

  if (!subject || subject.length < 2) {
    return NextResponse.json(
      { error: "Enter a subject line." },
      { status: 422 },
    );
  }

  if (!bodyText || bodyText.length < 2) {
    return NextResponse.json(
      { error: "Enter a message body." },
      { status: 422 },
    );
  }

  const { subject: renderedSubject, html } = renderAdminComposedEmail({
    heading: subject,
    bodyText,
    scripture:
      scriptureVerse && scriptureReference
        ? { verse: scriptureVerse, reference: scriptureReference }
        : undefined,
  });

  // Send individually so recipients don't see each other's addresses.
  const results = await Promise.all(
    uniqueRecipients.map((to) =>
      sendEmail({ to, subject: renderedSubject, html }).then((r) => ({
        to,
        ...r,
      })),
    ),
  );

  const sent = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  if (sent.length === 0) {
    return NextResponse.json(
      {
        error:
          failed[0]?.error ?? "The message could not be delivered. Try again.",
        sent: 0,
        failed: failed.length,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    data: {
      sent: sent.length,
      failed: failed.length,
      failedRecipients: failed.map((r) => r.to),
    },
    message:
      failed.length === 0
        ? `Message sent to ${sent.length} recipient${sent.length === 1 ? "" : "s"}.`
        : `Sent to ${sent.length}, failed for ${failed.length}.`,
  });
}
