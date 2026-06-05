export interface AdminUploadResult {
  objectKey: string;
}

export interface UploadAdminFileOptions {
  file: File;
  fileName: string;
  onProgress?: (progress: number) => void;
}

interface SignedUploadPayload {
  data?: {
    uploadUrl?: string;
    objectKey?: string;
  };
  error?: string;
}

export async function uploadAdminFile({
  file,
  fileName,
  onProgress,
}: UploadAdminFileOptions): Promise<AdminUploadResult> {
  onProgress?.(5);

  const response = await fetch("/api/admin/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fileName,
      contentType: file.type,
      contentLength: file.size,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | SignedUploadPayload
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Upload URL failed.");
  }

  const uploadUrl = payload?.data?.uploadUrl;
  const objectKey = payload?.data?.objectKey;

  if (!uploadUrl || !objectKey) {
    throw new Error("Upload URL failed.");
  }

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const transferProgress = Math.round((event.loaded / event.total) * 90);
      onProgress?.(Math.min(95, 5 + transferProgress));
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      reject(new Error("Upload to storage failed."));
    };

    request.onerror = () => reject(new Error("Upload to storage failed."));
    request.open("PUT", uploadUrl);
    request.setRequestHeader("content-type", file.type);
    request.send(file);
  });

  return { objectKey };
}
