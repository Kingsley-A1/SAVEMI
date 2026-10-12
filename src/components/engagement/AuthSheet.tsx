"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { X } from "lucide-react";

/**
 * Quick, passwordless sign-in in a small sheet: name + email, then the
 * 6-digit code from the inbox. New and returning members take the same path.
 * Whatever the visitor was doing (a comment draft, a like) waits for them.
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
  const [step, setStep] = useState<"details" | "code">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    firstField.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, onClose]);

  if (!open) return null;

  async function requestCode(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/account/code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email }),
    }).catch(() => null);
    setBusy(false);

    const data = (await response?.json().catch(() => null)) as
      | { message?: string; error?: string }
      | null;
    if (!response?.ok) {
      setError(data?.error ?? "We couldn't send a code. Please try again.");
      return;
    }
    setNotice(data?.message ?? "Check your email for a 6-digit code.");
    setStep("code");
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await signIn("email-code", { email, code, redirect: false });
    setBusy(false);

    if (!result || result.error) {
      setError("That code didn't work. Check it, or send a new one.");
      return;
    }
    onSignedIn(name.trim() || email.split("@")[0]);
  }

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
              {step === "details" ? "Join the conversation" : "Enter your code"}
            </h2>
            <p className="text-brand-muted mt-1 text-sm">
              {step === "details" ? reason : notice}
            </p>
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
            {error ? <p role="alert" className="text-xs" style={{ color: "var(--state-attention)" }}>{error}</p> : null}
            <button type="submit" disabled={busy} className="button-primary w-full">
              {busy ? "Sending…" : "Send me a code"}
            </button>
            <p className="text-brand-muted text-center text-xs">
              No password needed. We&apos;ll never share your email.
            </p>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-4 space-y-3">
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
            {error ? <p role="alert" className="text-xs" style={{ color: "var(--state-attention)" }}>{error}</p> : null}
            <button type="submit" disabled={busy || code.length !== 6} className="button-primary w-full">
              {busy ? "Checking…" : "Continue"}
            </button>
            <div className="flex justify-between text-xs">
              <button type="button" className="text-brand-muted hover:text-brand-primary" onClick={() => { setStep("details"); setCode(""); setError(""); }}>
                Change email
              </button>
              <button type="button" className="text-brand-muted hover:text-brand-primary" disabled={busy} onClick={() => void requestCode()}>
                Send a new code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
