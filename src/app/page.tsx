import Link from 'next/link';

const pillars = [
  {
    label: 'Repose',
    heading: 'A quiet landing place',
    body: 'Simple, calm design that keeps the ministry message central.',
  },
  {
    label: 'Renewal',
    heading: 'Structured content',
    body: 'Messages scale cleanly from a database-backed content layer.',
  },
  {
    label: 'Restoration',
    heading: 'Mobile-first by default',
    body: 'Every surface is shaped for small screens and refined upward.',
  },
];

export default function HomePage() {
  return (
    <section className="space-y-4">
      <div className="hero-surface px-6 py-10 sm:px-8 sm:py-14">
        <div className="max-w-2xl space-y-4">
          <p className="eyebrow" style={{ color: 'rgba(241,231,201,0.7)' }}>
            Sabbath Vesper Ministry
          </p>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-[#fff8ea] sm:text-5xl">
              SAVEMI
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: 'rgba(241,231,201,0.75)' }}>
              Repose · Renewal · Restoration
            </p>
          </div>
          <p className="max-w-lg text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
            Reflective worship at eventide — sermons, music, and devotional messages shaped for
            calm, mobile-first access.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/messages" className="button-primary">
              Browse Messages
            </Link>
            <Link href="/about" className="button-secondary">
              About the Ministry
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {pillars.map((item) => (
          <article key={item.label} className="site-panel p-4 sm:p-5">
            <p className="eyebrow text-brand-primary">{item.label}</p>
            <h2 className="mt-2 text-sm font-semibold">{item.heading}</h2>
            <p className="text-brand-muted mt-1.5 text-xs leading-5">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
