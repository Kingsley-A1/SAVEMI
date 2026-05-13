export default function QuotesLoading() {
  return (
    <section className="space-y-4">
      <div className="site-panel p-4 sm:p-6 animate-pulse">
        <div className="h-3 w-20 rounded bg-current opacity-10" />
        <div className="mt-2 h-8 w-64 rounded bg-current opacity-10" />
        <div className="mt-2 h-4 w-96 rounded bg-current opacity-10" />
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="site-panel overflow-hidden animate-pulse">
            <div className="aspect-square w-full bg-current opacity-10" />
            <div className="p-4 space-y-2">
              <div className="h-3 w-3/4 rounded bg-current opacity-10" />
              <div className="h-3 w-1/2 rounded bg-current opacity-10" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
