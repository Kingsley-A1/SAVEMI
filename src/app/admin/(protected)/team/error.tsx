"use client";

import ErrorState from "../../../../components/ui/ErrorState";

export default function AdminTeamError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      variant="panel"
      title="The team screen could not be loaded"
      description="No team member was added, changed, or removed by this error. Try again, or return to the team list."
      onRetry={reset}
      homeHref="/admin/team"
      homeLabel="Back to team"
      digest={error.digest}
    />
  );
}
