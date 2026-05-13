"use client";

export default function QuotesError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="site-panel p-8 text-center">
      <p className="text-brand-muted text-sm">
        Something went wrong loading the quotes gallery.
      </p>
      <button onClick={reset} className="button-tertiary mt-4">
        Try again
      </button>
    </div>
  );
}
