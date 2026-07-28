import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { isDatabaseConfigured } from "../../../../lib/db";
import { audit } from "../../../../lib/audit";
import {
  SITE_SETTING_KEYS,
  getSiteSettings,
  saveSiteSettings,
  type SiteSettingKey,
} from "../../../../lib/site-settings";

// GET /api/admin/settings — current contact details and social handles.
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ data: await getSiteSettings() });
}

// PUT /api/admin/settings — save the owner-editable values.
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const values: Partial<Record<SiteSettingKey, string>> = {};
  for (const key of SITE_SETTING_KEYS) {
    if (key in body) {
      values[key] = typeof body[key] === "string" ? (body[key] as string) : "";
    }
  }

  const email = values.contactEmail?.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid contact email address." },
      { status: 422 },
    );
  }

  for (const key of ["facebookUrl", "youtubeUrl", "instagramUrl", "telegramUrl"] as const) {
    const value = values[key]?.trim();
    if (value && !/^https?:\/\//i.test(value)) {
      return NextResponse.json(
        { error: `${key} must start with http:// or https://` },
        { status: 422 },
      );
    }
  }

  try {
    await saveSiteSettings(values, session.user?.email ?? undefined);

    await audit({
      session,
      request: req,
      action: "settings.update",
      entityType: "SiteSetting",
      detail: { keys: Object.keys(values) },
    });

    return NextResponse.json({ data: await getSiteSettings() });
  } catch {
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 },
    );
  }
}
