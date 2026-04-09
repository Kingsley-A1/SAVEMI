'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password.');
      return;
    }

    router.replace(callbackUrl);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f2e8] px-4">
      <div className="site-panel w-full max-w-sm p-6 sm:p-8">
        {/* Logotype */}
        <div className="mb-6 text-center">
          <p className="eyebrow text-brand-primary">SAVEMI</p>
          <h1 className="mt-1 text-xl font-semibold">Admin Login</h1>
          <p className="text-brand-muted mt-1 text-xs">
            Restricted to authorised ministry staff.
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
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="field-input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a7268]"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded px-3 py-2 text-xs"
              style={{
                background: 'rgba(220,38,38,0.07)',
                color: '#b91c1c',
                border: '1px solid rgba(220,38,38,0.2)',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="button-primary w-full"
            disabled={loading}
          >
            <LogIn size={15} className="mr-1.5" />
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
