"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/admin";
  const justRegistered = params.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [slowMessage, setSlowMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSlowMessage("");
    setLoading(true);

    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => {
      setSlowMessage(
        "This is taking longer than normal. Keep this page open while the admin session is checked.",
      );
    }, 10000);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or access code.");
        return;
      }

      router.replace(callbackUrl);
    } catch {
      setError("The admin login request failed. Check your connection and try again.");
    } finally {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
      setSlowMessage("");
      setLoading(false);
    }
  }

  function toggleAccessCodeVisibility() {
    setShowPw((value) => !value);
  }

  function handleCodeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;

    setPassword(value);
    if (error) setError("");
    if (slowMessage) setSlowMessage("");
  }

  function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;

    setEmail(value);
    if (error) setError("");
    if (slowMessage) setSlowMessage("");
  }

  function renderFeedback() {
    if (error) {
      return (
        <p
          role="alert"
          className="rounded px-3 py-2 text-xs"
          style={{
            background: "rgba(220,38,38,0.07)",
            color: "#b91c1c",
            border: "1px solid rgba(220,38,38,0.2)",
          }}
        >
          {error}
        </p>
      );
    }

    if (slowMessage) {
      return (
        <p
          role="status"
          className="rounded px-3 py-2 text-xs"
          style={{
            background: "rgba(217,119,6,0.08)",
            color: "#92400e",
            border: "1px solid rgba(217,119,6,0.2)",
          }}
        >
          {slowMessage}
        </p>
      );
    }

    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f2e8] px-4">
      <div className="site-panel w-full max-w-sm p-6 sm:p-8">
        {/* Logotype */}
        <div className="mb-6 text-center">
          <p className="eyebrow text-brand-primary">SAVEMI</p>
          <h1 className="mt-1 text-xl font-semibold">Admin Login</h1>
          <p className="text-brand-muted mt-1 text-xs leading-5">
            Sign in with your registered email and the shared 6-character
            ministry access code.
          </p>
        </div>

        {justRegistered ? (
          <p
            className="mb-4 rounded px-3 py-2 text-xs"
            style={{
              background: "rgba(22,163,74,0.08)",
              color: "#15803d",
              border: "1px solid rgba(22,163,74,0.18)",
            }}
          >
            Admin account created. Sign in with the same shared access code.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
              onChange={handleEmailChange}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              Access code
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                className="field-input pr-10"
                value={password}
                onChange={handleCodeChange}
                disabled={loading}
              />
              <button
                type="button"
                onClick={toggleAccessCodeVisibility}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a7268]"
                aria-label={showPw ? "Hide access code" : "Show access code"}
                aria-pressed={showPw}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {renderFeedback()}

          <button
            type="submit"
            className="button-primary w-full"
            disabled={loading}
          >
            <LogIn size={15} className="mr-1.5" />
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-brand-muted mt-5 text-center text-xs">
          Need a new admin account?{" "}
          <Link
            href={`/admin/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-brand-primary underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
