"use client";

import { useState } from "react";
import { CheckCircle2, HardDriveUpload, XCircle } from "lucide-react";
import { LoadingButton } from "../../../../components/ui/Loading";

interface CheckResponse {
  serverOk: boolean;
  serverDetail: string;
  browserProbeUrl: string | null;
  browserProbeKey: string | null;
  origin: string | null;
}

type Verdict = "healthy" | "cors" | "server" | "unknown";

interface Result {
  verdict: Verdict;
  serverDetail: string;
  browserDetail: string;
  origin: string | null;
}

const VERDICT_COPY: Record<Verdict, { title: string; tone: string }> = {
  healthy: { title: "Uploads are working", tone: "#15803d" },
  cors: { title: "The browser is blocked by the bucket", tone: "#b45309" },
  server: { title: "The server cannot reach storage", tone: "#b91c1c" },
  unknown: { title: "The check could not be completed", tone: "#b45309" },
};

/**
 * End-to-end upload check.
 *
 * An upload can fail on the server side (credentials, bucket) or on the
 * browser side (the bucket's CORS policy refusing this origin). The two look
 * identical to someone using the admin office, so this runs both halves and
 * names the one that is actually broken.
 */
export default function StorageCheck() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/storage-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: CheckResponse;
      } | null;
      const data = payload?.data;

      if (!data) {
        setResult({
          verdict: "unknown",
          serverDetail: "The check did not return a result.",
          browserDetail: "",
          origin: null,
        });
        return;
      }

      if (!data.serverOk) {
        setResult({
          verdict: "server",
          serverDetail: data.serverDetail,
          browserDetail:
            "The browser half was not attempted — fix the server side first.",
          origin: data.origin,
        });
        return;
      }

      if (!data.browserProbeUrl) {
        setResult({
          verdict: "unknown",
          serverDetail: data.serverDetail,
          browserDetail: "A test upload address could not be prepared.",
          origin: data.origin,
        });
        return;
      }

      // The real test: a direct browser PUT, exactly like a genuine upload.
      let browserOk = false;
      let browserDetail = "";

      try {
        const probe = await fetch(data.browserProbeUrl, {
          method: "PUT",
          headers: { "content-type": "text/plain" },
          body: "savemi-storage-check",
        });

        browserOk = probe.ok;
        browserDetail = probe.ok
          ? "The browser uploaded a test object directly to storage."
          : `Storage refused the browser upload with status ${probe.status}.`;
      } catch {
        // A thrown fetch on a cross-origin PUT means the browser refused it.
        browserDetail =
          "The browser was refused before the upload left the page. This is the bucket's CORS policy.";
      }

      if (browserOk && data.browserProbeKey) {
        void fetch("/api/admin/storage-check", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ cleanupKey: data.browserProbeKey }),
        }).catch(() => {});
      }

      setResult({
        verdict: browserOk ? "healthy" : "cors",
        serverDetail: data.serverDetail,
        browserDetail,
        origin: data.origin,
      });
    } catch {
      setResult({
        verdict: "unknown",
        serverDetail: "The check could not be reached.",
        browserDetail: "",
        origin: null,
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="site-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Upload check</h2>
          <p className="text-brand-muted mt-1 max-w-prose text-xs leading-5">
            Runs a real test upload from this screen — first from the server,
            then from your browser — so a failure names its own cause instead
            of just saying the upload failed.
          </p>
        </div>

        <LoadingButton
          onClick={run}
          loading={running}
          loadingLabel="Checking…"
          icon={<HardDriveUpload size={14} />}
          className="button-tertiary"
          spinnerTone="primary"
        >
          Run upload check
        </LoadingButton>
      </div>

      {result ? (
        <div
          className="mt-4 border-l-[3px] pl-4"
          style={{ borderColor: VERDICT_COPY[result.verdict].tone }}
          role="status"
        >
          <p
            className="flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: VERDICT_COPY[result.verdict].tone }}
          >
            {result.verdict === "healthy" ? (
              <CheckCircle2 size={15} aria-hidden="true" />
            ) : (
              <XCircle size={15} aria-hidden="true" />
            )}
            {VERDICT_COPY[result.verdict].title}
          </p>

          <dl className="mt-3 space-y-2 text-xs leading-5">
            <div>
              <dt className="font-semibold">Server to storage</dt>
              <dd className="text-brand-muted">{result.serverDetail}</dd>
            </div>
            {result.browserDetail ? (
              <div>
                <dt className="font-semibold">Browser to storage</dt>
                <dd className="text-brand-muted">{result.browserDetail}</dd>
              </div>
            ) : null}
          </dl>

          {result.verdict === "cors" ? (
            <div
              className="mt-3 p-3 text-xs leading-5"
              style={{ background: "rgba(180,83,9,0.07)" }}
            >
              <p className="font-semibold">How to fix this</p>
              <p className="text-brand-muted mt-1">
                The bucket accepts the server but not this browser. In
                Cloudflare → R2 → your bucket → Settings → CORS Policy, add
                this exact address to <code>AllowedOrigins</code>, keep
                <code> PUT</code> in <code>AllowedMethods</code>, and keep
                <code> ETag</code> in <code>ExposeHeaders</code>:
              </p>
              <p className="mt-2">
                <code className="font-mono font-semibold">
                  {result.origin ?? "this site's address"}
                </code>
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
