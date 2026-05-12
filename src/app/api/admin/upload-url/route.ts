import { auth } from "../../../../../auth";
import { NextResponse } from "next/server";
import {
  buildUploadObjectKey,
  getCompressionPlan,
  validateUploadRequest,
} from "../../../../lib/media";
import { createUploadUrl, isStorageConfigured } from "../../../../lib/r2";

// P0-1: Upload signing is now behind admin auth.
// This route lives at /api/admin/upload-url and is protected by both
// the middleware matcher (/api/admin/:path*) and this explicit session check.
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized. Admin session required." },
      { status: 401 },
    );
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      {
        error:
          "Storage is not configured. Add the Cloudflare R2 environment variables first.",
      },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => null);
  const validation = validateUploadRequest(payload);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }

  const objectKey = buildUploadObjectKey({
    fileName: validation.data.fileName,
    mediaKind: validation.data.mediaKind,
  });

  const uploadUrl = await createUploadUrl({
    key: objectKey,
    contentType: validation.data.contentType,
  });

  return NextResponse.json({
    data: {
      objectKey,
      uploadUrl,
      mediaKind: validation.data.mediaKind,
      contentType: validation.data.contentType,
      compressionPlan: getCompressionPlan(validation.data.mediaKind),
    },
  });
}
