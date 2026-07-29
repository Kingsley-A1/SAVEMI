"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, MailCheck, Send } from "lucide-react";
import AuthCard from "../../components/AuthCard";
import CodeInput from "../../components/CodeInput";
import { LoadingButton } from "../../components/ui/Loading";
import { MIN_PASSWORD_LENGTH } from "../../lib/site-users";

type Step = "request" | "reset" | "done";

export default function ForgotPasswordForm() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function post(url: string, payload: Record<string, unknown>) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as {
      error?: string;
      message?: string;
    } | null;

    return { ok: response.ok, data };
  }

  async function requestCode(event?: React.FormEvent) {
    event?.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    try {
      const { ok, data } = await post("/api/account/password/forgot", {
        email,
      });

      if (!ok) {
        setError(data?.error ?? "Unable to send a reset code.");
        return;
      }

      setNotice(data?.message ?? "If that account exists, a code is on its way.");
      setStep("reset");
    } catch {
      setError("The request failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    try {
      const { ok, data } = await post("/api/account/password/reset", {
        email,
        code,
        password,
      });

      if (!ok) {
        setError(data?.error ?? "Unable to reset your password.");
        return;
      }

      setStep("done");
      setNotice(data?.message ?? "Your password has been reset.");
      setTimeout(() => router.replace("/login"), 1600);
    } catch {
      setError("The request failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const feedback = (
    <>
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
          className="flex items-start gap-2 rounded px-3 py-2 text-xs"
          style={{
            background: "rgba(22,163,74,0.08)",
            color: "#15803d",
            border: "1px solid rgba(22,163,74,0.18)",
          }}
        >
          {step === "done" ? (
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          ) : (
            <MailCheck size={14} className="mt-0.5 shrink-0" />
          )}
          <span>{notice}</span>
        </p>
      ) : null}
    </>
  );

  return (
    <AuthCard
      title={step === "request" ? "Forgot your password?" : "Choose a new password"}
      subtitle={
        step === "request"
          ? "Enter your email and we'll send you a 6-digit code to reset your password."
          : "Enter the code we emailed you, then set a new password."
      }
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="text-brand-primary underline">
            Sign in
          </Link>
        </>
      }
    >
      {step === "request" ? (
        <form onSubmit={requestCode} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </div>

          {feedback}

          <LoadingButton
            type="submit"
            className="button-primary w-full"
            loading={busy}
            loadingLabel="Sending…"
            icon={<Send size={15} />}
          >
            Send reset code
          </LoadingButton>
        </form>
      ) : (
        <form onSubmit={submitReset} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email-readonly" className="field-label">
              Email
            </label>
            <input
              id="email-readonly"
              className="field-input"
              value={email}
              readOnly
              disabled
            />
          </div>

          <CodeInput
            value={code}
            onChange={setCode}
            disabled={busy || step === "done"}
          />

          <div>
            <label htmlFor="password" className="field-label">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy || step === "done"}
            />
            <p className="text-brand-muted mt-1 text-xs">
              At least {MIN_PASSWORD_LENGTH} characters, including a letter and
              a number.
            </p>
          </div>

          {feedback}

          <LoadingButton
            type="submit"
            className="button-primary w-full"
            loading={busy}
            loadingLabel="Resetting…"
            icon={<KeyRound size={15} />}
            disabled={step === "done"}
          >
            Reset password
          </LoadingButton>

          <button
            type="button"
            onClick={() => requestCode()}
            disabled={busy || step === "done"}
            className="text-brand-muted hover:text-brand-primary w-full text-center text-xs underline transition-colors"
          >
            Send me a new code
          </button>
        </form>
      )}
    </AuthCard>
  );
}
