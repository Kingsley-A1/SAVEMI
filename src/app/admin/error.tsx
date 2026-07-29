"use client";

import ErrorState from "../../components/ui/ErrorState";

export default function AdminAuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="The admin office could not be reached"
      description="Something went wrong before this screen could load. Try again, or return to the public site."
      onRetry={reset}
      homeHref="/"
      homeLabel="Go to the public site"
      digest={error.digest}
    />
  );
}
