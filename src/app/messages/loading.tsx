export default function MessagesLoading() {
  return (
    <section className="space-y-4">
      <div className="site-panel animate-pulse p-4 sm:p-6">
        <div className="h-3 w-16 rounded bg-[var(--brand-border)]" />
        <div className="mt-2 h-6 w-44 rounded bg-[var(--brand-border)]" />
        <div className="mt-2 h-3 w-72 rounded bg-[var(--brand-border)]" />
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="site-panel animate-pulse p-4 sm:p-5">
            <div className="flex gap-2">
              <div className="h-5 w-14 rounded bg-[var(--brand-border)]" />
              <div className="h-5 w-20 rounded bg-[var(--brand-border)]" />
            </div>
            <div className="mt-3 h-4 w-3/4 rounded bg-[var(--brand-border)]" />
            <div className="mt-1.5 h-3 w-full rounded bg-[var(--brand-border)]" />
            <div className="mt-1 h-3 w-5/6 rounded bg-[var(--brand-border)]" />
            <div className="mt-4 flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-[var(--brand-border)]" />
              <div className="h-7 w-16 rounded bg-[var(--brand-border)]" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
