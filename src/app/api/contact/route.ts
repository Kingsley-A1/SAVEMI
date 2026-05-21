import { NextResponse } from "next/server";
import {
  createContactSubmission,
  validateContactSubmission,
} from "../../../lib/contact";
import { isDatabaseConfigured } from "../../../lib/db";
import {
  contactLimiter,
  getClientIp,
  rateLimitResponse,
} from "../../../lib/rate-limit";

async function parseRequestPayload(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();

    return {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
      website: formData.get("website"),
    };
  }

  return null;
}

export async function POST(request: Request) {
  // Rate limit: 5 submissions per 10 minutes per IP.
  const ip = getClientIp(request);
  const limit = contactLimiter.check(`contact:${ip}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Contact submissions are not available until the database is configured.",
      },
      { status: 503 },
    );
  }

  const payload = await parseRequestPayload(request);
  const validation = validateContactSubmission(payload);

  if (!validation.success) {
    const status = validation.error === "Spam submission rejected." ? 400 : 422;

    return NextResponse.json({ error: validation.error }, { status });
  }

  await createContactSubmission(validation.data);

  return NextResponse.json(
    {
      data: {
        message:
          "Your message has been received. We will respond as soon as possible.",
      },
    },
    { status: 201 },
  );
}
