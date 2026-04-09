export default function MessageDetailLoading() {
  return (
    <article className="mx-auto max-w-3xl animate-pulse space-y-4">
      <div className="site-panel p-4 sm:p-6">
        <div className="flex gap-2">
          <div className="h-5 w-14 rounded bg-[var(--brand-border)]" />
          <div className="h-5 w-24 rounded bg-[var(--brand-border)]" />
        </div>
        <div className="mt-3 h-7 w-2/3 rounded bg-[var(--brand-border)]" />
        <div className="mt-2 h-3 w-full rounded bg-[var(--brand-border)]" />
        <div className="mt-1 h-3 w-5/6 rounded bg-[var(--brand-border)]" />
        <div className="mt-3 h-3 w-1/3 rounded bg-[var(--brand-border)]" />
      </div>

      <div className="site-panel p-4">
        <div className="h-48 rounded bg-[var(--brand-border)]" />
      </div>

      <div className="site-panel p-4 sm:p-6">
        <div className="h-3 w-16 rounded bg-[var(--brand-border)]" />
        <div className="mt-2 h-3 w-full rounded bg-[var(--brand-border)]" />
        <div className="mt-1 h-3 w-4/5 rounded bg-[var(--brand-border)]" />
      </div>
    </article>
  );
}
