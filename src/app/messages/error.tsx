'use client';

import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MessagesError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="space-y-4">
      <div className="site-panel p-6 text-center">
        <p className="text-brand-primary text-sm font-semibold">Could not load messages</p>
        <p className="text-brand-muted mt-1 text-sm">
          {error.message ?? 'An unexpected error occurred. Please try again.'}
        </p>
        <button onClick={reset} className="button-tertiary mt-4">
          Try again
        </button>
      </div>
    </section>
  );
}
