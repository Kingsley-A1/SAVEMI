import { auth } from "../../../../../auth";
import { NextResponse } from "next/server";
import {
  buildUploadObjectKey,
  validateUploadRequest,
} from "../../../../lib/media";
import {
  abortMultipartUpload,
  completeMultipartUpload,
  createMultipartUpload,
  createPartUploadUrl,
  isStorageConfigured,
} from "../../../../lib/r2";

/**
 * Resilient multipart upload signer for large media (300MB+).
 *
 * One route, four actions (POST body `{ action }`):
 *   initiate → create the multipart upload, return { uploadId, objectKey }
 *   sign     → presign a batch of part URLs, return { parts: [{ partNumber, url }] }
 *   complete → finalize with the collected ETags
 *   abort    → clean up a failed/cancelled upload
 *
 * Protected by the /api/admin middleware matcher and this session check.
 */
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

  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!payload || typeof payload.action !== "string") {
    return NextResponse.json({ error: "Missing action." }, { status: 400 });
  }

  try {
    switch (payload.action) {
      case "initiate": {
        const validation = validateUploadRequest({
          fileName: payload.fileName,
          contentType: payload.contentType,
          contentLength: payload.contentLength,
        });
        if (!validation.success) {
          return NextResponse.json(
            { error: validation.error },
            { status: 422 },
          );
        }

        const objectKey = buildUploadObjectKey({
          fileName: validation.data.fileName,
          mediaKind: validation.data.mediaKind,
        });

        const { uploadId } = await createMultipartUpload({
          key: objectKey,
          contentType: validation.data.contentType,
        });

        return NextResponse.json({
          data: {
            uploadId,
            objectKey,
            mediaKind: validation.data.mediaKind,
          },
        });
      }

      case "sign": {
        const key = typeof payload.key === "string" ? payload.key : "";
        const uploadId =
          typeof payload.uploadId === "string" ? payload.uploadId : "";
        const partNumbers = Array.isArray(payload.partNumbers)
          ? payload.partNumbers.filter(
              (n): n is number => typeof n === "number" && n >= 1 && n <= 10000,
            )
          : [];

        if (!key || !uploadId || partNumbers.length === 0) {
          return NextResponse.json(
            { error: "key, uploadId and partNumbers are required." },
            { status: 400 },
          );
        }

        if (partNumbers.length > 1000) {
          return NextResponse.json(
            { error: "Too many parts requested at once." },
            { status: 400 },
          );
        }

        const parts = await Promise.all(
          partNumbers.map(async (partNumber) => ({
            partNumber,
            url: await createPartUploadUrl({ key, uploadId, partNumber }),
          })),
        );

        return NextResponse.json({ data: { parts } });
      }

      case "complete": {
        const key = typeof payload.key === "string" ? payload.key : "";
        const uploadId =
          typeof payload.uploadId === "string" ? payload.uploadId : "";
        const rawParts = Array.isArray(payload.parts) ? payload.parts : [];
        const parts = rawParts
          .map((p) => p as { partNumber?: unknown; eTag?: unknown })
          .filter(
            (p) =>
              typeof p.partNumber === "number" && typeof p.eTag === "string",
          )
          .map((p) => ({
            partNumber: p.partNumber as number,
            eTag: p.eTag as string,
          }));

        if (!key || !uploadId || parts.length === 0) {
          return NextResponse.json(
            { error: "key, uploadId and parts are required." },
            { status: 400 },
          );
        }

        await completeMultipartUpload({ key, uploadId, parts });
        return NextResponse.json({ data: { objectKey: key } });
      }

      case "abort": {
        const key = typeof payload.key === "string" ? payload.key : "";
        const uploadId =
          typeof payload.uploadId === "string" ? payload.uploadId : "";
        if (key && uploadId) {
          await abortMultipartUpload({ key, uploadId }).catch(() => {});
        }
        return NextResponse.json({ data: { aborted: true } });
      }

      default:
        return NextResponse.json(
          { error: "Unknown action." },
          { status: 400 },
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Multipart upload failed.",
      },
      { status: 500 },
    );
  }
}
