"use client";

import ErrorState from "../../components/ui/ErrorState";

export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      variant="panel"
      title="Messages could not be loaded"
      description="We could not reach the message library just now. Try again in a moment."
      onRetry={reset}
      digest={error.digest}
    />
  );
}
