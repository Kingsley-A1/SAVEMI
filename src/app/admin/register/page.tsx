"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function AdminRegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/admin/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setLoading(false);
      setError(payload.error ?? "Unable to create admin account.");
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      router.replace("/admin/login?registered=1");
      return;
    }

    router.replace(callbackUrl);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="site-panel w-full max-w-sm p-6 sm:p-8">
        <div className="mb-6 text-center">
          <p className="eyebrow text-brand-primary">SAVEMI</p>
          <h1 className="mt-1 text-xl font-semibold">Register Admin</h1>
          <p className="text-brand-muted mt-1 text-xs leading-5">
            Use your email address and the shared 6-character ministry access
            code.
          </p>
        </div>

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
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              Shared Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="field-input pr-10"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a7268]"
                aria-label={showPassword ? "Hide password" : "Show password"}
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
                background: "rgba(220,38,38,0.07)",
                color: "#b91c1c",
                border: "1px solid rgba(220,38,38,0.2)",
              }}
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="button-primary w-full"
            disabled={loading}
          >
            <UserPlus size={15} className="mr-1.5" />
            {loading ? "Creating account..." : "Register admin"}
          </button>
        </form>

        <p className="text-brand-muted mt-5 text-center text-xs">
          Already registered?{" "}
          <Link href="/admin/login" className="text-brand-primary underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
