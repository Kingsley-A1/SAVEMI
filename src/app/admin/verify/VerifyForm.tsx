"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, MailCheck, ShieldCheck } from "lucide-react";
import AuthCard from "../../../components/AuthCard";
import CodeInput from "../../../components/CodeInput";
import { LoadingButton } from "../../../components/ui/Loading";

export default function AdminVerifyForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    params.get("sent") === "1"
      ? "We sent a 6-digit code to your email. Enter it below."
      : "",
  );
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to confirm your email.");
        return;
      }

      setDone(true);
      setNotice(payload?.message ?? "Email confirmed.");
      setTimeout(() => router.replace("/admin/login?verified=1"), 1400);
    } catch {
      setError("The request failed. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError("Enter your admin email first.");
      return;
    }

    setError("");
    setNotice("");
    setResending(true);

    try {
      const response = await fetch("/api/admin/verify?resend=1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to send a new code.");
        return;
      }

      setCode("");
      setNotice(payload?.message ?? "A new code is on its way.");
    } catch {
      setError("The request failed. Check your connection and try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthCard
      title="Confirm your email"
      subtitle="Enter the 6-digit code we emailed you to activate your admin account."
      footer={
        <>
          Already confirmed?{" "}
          <Link href="/admin/login" className="text-brand-primary underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="field-label">
            Admin email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting || done}
          />
        </div>

        <CodeInput
          value={code}
          onChange={setCode}
          disabled={submitting || done}
          hint="Check your inbox — the code expires shortly after it is sent."
        />

        {error ? (
          <p
            role="alert"
            className="rounded px-3 py-2 text-xs"
            style={{
              background: "var(--state-attention-surface)",
              color: "var(--state-attention)",
              border: "1px solid var(--state-attention-border)",
            }}
          >
            {error}
          </p>
        ) : null}

        {notice ? (
          <p
            className="flex items-center gap-2 rounded px-3 py-2 text-xs"
            style={{
              background: "rgba(22,163,74,0.08)",
              color: "#15803d",
              border: "1px solid rgba(22,163,74,0.18)",
            }}
          >
            {done ? <CheckCircle2 size={14} /> : <MailCheck size={14} />}
            {notice}
          </p>
        ) : null}

        <LoadingButton
          type="submit"
          className="button-primary w-full"
          loading={submitting}
          loadingLabel="Confirming…"
          icon={<ShieldCheck size={15} />}
          disabled={done}
        >
          Confirm email
        </LoadingButton>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending || submitting || done}
          className="text-brand-muted hover:text-brand-primary w-full text-center text-xs underline transition-colors"
        >
          {resending ? "Sending…" : "Send me a new code"}
        </button>
      </form>
    </AuthCard>
  );
}
