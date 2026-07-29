"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import AuthCard from "../../components/AuthCard";
import { LoadingButton } from "../../components/ui/Loading";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/account";
  const justRegistered = params.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("The request failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your SAVEMI account."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="text-brand-primary underline">
            Create an account
          </Link>
        </>
      }
    >
      {justRegistered ? (
        <p
          className="mb-4 rounded px-3 py-2 text-xs"
          style={{
            background: "rgba(22,163,74,0.08)",
            color: "#15803d",
            border: "1px solid rgba(22,163,74,0.18)",
          }}
        >
          Your account was created. Sign in to continue.
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
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-brand-muted hover:text-brand-primary mb-1.5 text-xs underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="field-input pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a7268]"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

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

        <LoadingButton
          type="submit"
          className="button-primary w-full"
          loading={loading}
          loadingLabel="Signing in…"
          icon={<LogIn size={15} />}
        >
          Sign in
        </LoadingButton>
      </form>
    </AuthCard>
  );
}
