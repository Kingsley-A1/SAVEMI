"use client";

import ErrorState from "../components/ui/ErrorState";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="This page could not be loaded"
      description="Something went wrong on our side. Take a moment of repose, then try again — the rest of the site is still available."
      onRetry={reset}
      digest={error.digest}
    />
  );
}
