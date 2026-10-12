"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { X } from "lucide-react";

type Step = "details" | "code" | "password";

/**
 * Quick sign-in in a small sheet. New and returning members get a 6-digit
 * code by email; anyone with a password — or an admin with the ministry
 * access code — can use that instead. Whatever the visitor was doing (a
 * comment draft, a like) waits for them.
 */
export default function AuthSheet({
  open,
  reason,
  onClose,
  onSignedIn,
}: {
  open: boolean;
  reason: string;
  onClose: () => void;
  onSignedIn: (name: string) => void;
}) {
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [canUsePassword, setCanUsePassword] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    firstField.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, onClose]);

  if (!open) return null;

  function goTo(next: Step, message = "") {
    setStep(next);
    setError("");
    setNotice(message);
    setCanUsePassword(false);
  }

  async function requestCode(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    setCanUsePassword(false);
    const response = await fetch("/api/account/code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email }),
    }).catch(() => null);
    setBusy(false);

    const data = (await response?.json().catch(() => null)) as
      | { message?: string; error?: string; code?: string }
      | null;

    if (data?.code === "ADMIN_ACCOUNT") {
      goTo("password", "This is an admin account. Enter your ministry access code.");
      return;
    }
    if (!response?.ok) {
      setError(data?.error ?? "We couldn't send a code. Please try again.");
      setCanUsePassword(data?.code === "SEND_FAILED");
      return;
    }
    goTo("code", data?.message ?? "Check your email for a 6-digit code.");
  }

  async function finish(result: Awaited<ReturnType<typeof signIn>> | undefined, failure: string) {
    setBusy(false);
    if (!result || result.error) {
      setError(failure);
      return;
    }
    onSignedIn(name.trim() || email.split("@")[0]);
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await signIn("email-code", { email, code, redirect: false }).catch(() => undefined);
    await finish(result, "That code didn't work. Check it, or send a new one.");
  }

  async function signInWithPassword(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false }).catch(() => undefined);
    await finish(result, "That email and password didn't match.");
  }

  const title =
    step === "details" ? "Join the conversation" : step === "code" ? "Enter your code" : "Sign in";
  const subtitle =
    step === "details" ? reason : notice || "Use your password, or the ministry access code if you're an admin.";
  const errorLine = error ? (
    <p role="alert" className="text-xs" style={{ color: "var(--state-attention)" }}>
      {error}
    </p>
  ) : null;
  const link = "text-brand-muted hover:text-brand-primary";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-sheet-title"
        className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="auth-sheet-title" className="text-base font-semibold">
              {title}
            </h2>
            <p className="text-brand-muted mt-1 text-sm">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-muted -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-black/5"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {step === "details" ? (
          <form onSubmit={requestCode} className="mt-4 space-y-3">
            <input
              ref={firstField}
              className="field-input"
              placeholder="Your name"
              autoComplete="name"
              aria-label="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="field-input"
              type="email"
              placeholder="Email"
              autoComplete="email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errorLine}
            {canUsePassword ? (
              <button type="button" className="button-tertiary w-full" onClick={() => goTo("password")}>
                Sign in with my password instead
              </button>
            ) : null}
            <button type="submit" disabled={busy} className="button-primary w-full">
              {busy ? "Sending…" : "Send me a code"}
            </button>
            <p className="text-brand-muted text-center text-xs">
              Already registered? Use the same email.{" "}
              <button type="button" className="underline hover:text-brand-primary" onClick={() => goTo("password")}>
                Use a password
              </button>
            </p>
          </form>
        ) : step === "code" ? (
          <form onSubmit={verifyCode} className="mt-4 space-y-3">
            <input
              ref={firstField}
              className="field-input text-center text-lg tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              aria-label="6-digit code"
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              required
            />
            {errorLine}
            <button type="submit" disabled={busy || code.length !== 6} className="button-primary w-full">
              {busy ? "Checking…" : "Continue"}
            </button>
            <div className="flex justify-between text-xs">
              <button type="button" className={link} onClick={() => { goTo("details"); setCode(""); }}>
                Change email
              </button>
              <button type="button" className={link} disabled={busy} onClick={() => void requestCode()}>
                Send a new code
              </button>
            </div>
            <p className="text-brand-muted text-center text-xs">
              Not there? Check your spam or promotions folder.
            </p>
          </form>
        ) : (
          <form onSubmit={signInWithPassword} className="mt-4 space-y-3">
            <input
              className="field-input"
              type="email"
              placeholder="Email"
              autoComplete="email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              ref={firstField}
              className="field-input"
              type="password"
              placeholder="Password or access code"
              autoComplete="current-password"
              aria-label="Password or access code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {errorLine}
            <button type="submit" disabled={busy} className="button-primary w-full">
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <div className="flex justify-between text-xs">
              <button type="button" className={link} onClick={() => goTo("details")}>
                Email me a code instead
              </button>
              <a href="/forgot-password" className={link}>
                Forgot password?
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
