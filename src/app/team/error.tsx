"use client";

import ErrorState from "../../components/ui/ErrorState";

export default function TeamError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      variant="panel"
      title="The team page could not be loaded"
      description="We could not reach the ministry team just now. Try again in a moment."
      onRetry={reset}
      digest={error.digest}
    />
  );
}
