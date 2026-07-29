"use client";

import ErrorState from "../../../components/ui/ErrorState";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      variant="panel"
      title="This admin screen could not be loaded"
      description="Your work is safe — nothing was saved or changed by this error. Try again, or return to the dashboard and come back to it."
      onRetry={reset}
      homeHref="/admin"
      homeLabel="Back to dashboard"
      digest={error.digest}
    />
  );
}
