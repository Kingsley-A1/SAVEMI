'use client';

import Link from 'next/link';
import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
}

export default function MessageDetailError({ error }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <article className="mx-auto max-w-3xl">
      <div className="site-panel p-6 text-center">
        <p className="text-brand-primary text-sm font-semibold">Could not load this message</p>
        <p className="text-brand-muted mt-1 text-sm">
          {error.message ?? 'An unexpected error occurred.'}
        </p>
        <Link href="/messages" className="button-tertiary mt-4 inline-flex">
          ← Back to messages
        </Link>
      </div>
    </article>
  );
}
