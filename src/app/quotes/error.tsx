"use client";

import ErrorState from "../../components/ui/ErrorState";

export default function QuotesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      variant="panel"
      title="Quotes could not be loaded"
      description="We could not reach the quotes gallery just now. Try again in a moment."
      onRetry={reset}
      digest={error.digest}
    />
  );
}
