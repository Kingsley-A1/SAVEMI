import { NextResponse } from "next/server";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { auth } from "../../../../../auth";
import { createUploadUrl, isStorageConfigured } from "../../../../lib/r2";

export const dynamic = "force-dynamic";

/**
 * Storage self-test for the Health screen.
 *
 * Uploads fail in two very different ways and the browser cannot tell them
 * apart on its own:
 *
 *   1. The server cannot talk to R2 at all — wrong keys, wrong bucket.
 *   2. The server is fine, but the browser is refused by the bucket's CORS
 *      policy, which is what a direct-to-R2 upload depends on.
 *
 * This route proves (1) by doing a real PUT/GET/DELETE round trip from the
 * server, then hands back a presigned URL so the browser can test (2) for
 * itself. Between them, the failing half is named exactly.
 */

const PROBE_BODY = "savemi-storage-check";

function client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CF_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CF_SECRET_ACCESS_KEY!,
    },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The browser probe leaves a tiny object behind when it succeeds; the
  // client posts back to have it removed.
  const payload = (await request.json().catch(() => null)) as {
    cleanupKey?: string;
  } | null;

  if (payload?.cleanupKey?.startsWith("diagnostics/")) {
    if (isStorageConfigured()) {
      await client()
        .send(
          new DeleteObjectCommand({
            Bucket: process.env.CF_BUCKET!,
            Key: payload.cleanupKey,
          }),
        )
        .catch(() => {});
    }
    return NextResponse.json({ data: { cleaned: true } });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json({
      data: {
        serverOk: false,
        serverDetail:
          "Storage is not configured. CF_ACCOUNT_ID, CF_ACCESS_KEY_ID, CF_SECRET_ACCESS_KEY, and CF_BUCKET must all be set.",
        browserProbeUrl: null,
        origin: null,
      },
    });
  }

  const key = `diagnostics/storage-check-${crypto.randomUUID()}.txt`;
  const bucket = process.env.CF_BUCKET!;
  const s3 = client();

  // ── 1. Server → R2 round trip ────────────────────────────────────────
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: PROBE_BODY,
        ContentType: "text/plain",
      }),
    );

    const read = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const body = await read.Body?.transformToString();

    if (body !== PROBE_BODY) {
      throw new Error("The object read back did not match what was written.");
    }
  } catch (error) {
    return NextResponse.json({
      data: {
        serverOk: false,
        serverDetail:
          error instanceof Error
            ? `The server could not write to the bucket: ${error.message}`
            : "The server could not write to the bucket.",
        browserProbeUrl: null,
        origin: null,
      },
    });
  } finally {
    // Never leave probe objects behind, even when the read failed.
    await s3
      .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
      .catch(() => {});
  }

  // ── 2. Presign a URL the browser can try for itself ──────────────────
  const probeKey = `diagnostics/browser-check-${crypto.randomUUID()}.txt`;
  let browserProbeUrl: string | null = null;

  try {
    browserProbeUrl = await createUploadUrl({
      key: probeKey,
      contentType: "text/plain",
      expiresInSeconds: 300,
    });
  } catch {
    browserProbeUrl = null;
  }

  return NextResponse.json({
    data: {
      serverOk: true,
      serverDetail:
        "The server wrote, read, and deleted a test object successfully. Credentials and bucket are correct.",
      browserProbeUrl,
      browserProbeKey: browserProbeUrl ? probeKey : null,
      // Echo the origin the request came from: this is the exact string that
      // has to appear in the bucket's AllowedOrigins.
      origin: request.headers.get("origin") ?? null,
    },
  });
}
