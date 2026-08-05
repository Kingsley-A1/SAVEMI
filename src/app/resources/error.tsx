"use client";

import ErrorState from "../../components/ui/ErrorState";

export default function ResourcesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      variant="panel"
      title="The library could not be loaded"
      description="We could not reach the resources library just now. Try again in a moment."
      onRetry={reset}
      digest={error.digest}
    />
  );
}
