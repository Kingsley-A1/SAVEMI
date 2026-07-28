"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import AuthCard from "../../components/AuthCard";
import { LoadingButton } from "../../components/ui/Loading";
import { MIN_PASSWORD_LENGTH } from "../../lib/site-users";

export default function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/account";

  const [name, setName] = useState("");
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
      const response = await fetch("/api/account/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to create your account.");
        return;
      }

      // Sign the new member straight in — no second form to fill.
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.replace("/login?registered=1");
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
      title="Create your account"
      subtitle="Join the SAVEMI family to keep up with Sabbath messages, reflections, and resources."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-brand-primary underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="field-label">
            Full name
          </label>
          <input
            id="name"
            autoComplete="name"
            required
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>

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
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
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
          <p className="text-brand-muted mt-1 text-xs">
            At least {MIN_PASSWORD_LENGTH} characters, including a letter and a
            number.
          </p>
        </div>

        {error ? (
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
        ) : null}

        <LoadingButton
          type="submit"
          className="button-primary w-full"
          loading={loading}
          loadingLabel="Creating account…"
          icon={<UserPlus size={15} />}
        >
          Create account
        </LoadingButton>
      </form>
    </AuthCard>
  );
}
