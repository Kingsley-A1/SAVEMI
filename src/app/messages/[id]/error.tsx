"use client";

import ErrorState from "../../../components/ui/ErrorState";

export default function MessageDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <article className="mx-auto max-w-3xl">
      <ErrorState
        variant="panel"
        title="This message could not be loaded"
        description="We could not reach it just now. Try again, or go back to the message library."
        onRetry={reset}
        homeHref="/videos"
        homeLabel="Back to messages"
        digest={error.digest}
      />
    </article>
  );
}
