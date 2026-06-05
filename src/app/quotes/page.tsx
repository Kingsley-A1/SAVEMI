import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getQuotes } from "../../lib/quotes";
import type { Quote } from "../../lib/quotes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quotes & Reflections",
  description:
    "Scripture, devotional truth, and words of encouragement from the Sabbath Vesper Ministry — visual and textual quote gallery.",
  openGraph: {
    title: "Quotes & Reflections | SAVEMI",
    description:
      "Scripture and devotional truth drawn from the Sabbath Vesper Ministry.",
  },
  alternates: { canonical: "/quotes" },
};

function QuoteCard({ quote }: { quote: Quote }) {
  return (
    <article className="site-panel group overflow-hidden">
      <Link href={`/quotes/${quote.slug}`} className="block">
        {/* Image or text-art card */}
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: "1/1",
            background: "var(--brand-primary-deep)",
          }}
        >
          {quote.imageUrl ? (
            <>
              <Image
                src={quote.imageUrl}
                alt={quote.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Gradient overlay with quote text */}
              <div
                className="absolute inset-0 flex flex-col justify-end p-4"
                style={{
                  background:
                    "linear-gradient(to top, rgba(6,55,39,0.96) 0%, rgba(6,55,39,0.72) 48%, rgba(6,55,39,0.22) 100%)",
                }}
              >
                <p
                  className="line-clamp-4 text-sm font-semibold leading-6 text-white"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}
                >
                  &ldquo;{quote.text}&rdquo;
                </p>
                {quote.attribution ? (
                  <p className="mt-2 text-xs font-medium text-white/75">
                    — {quote.attribution}
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            /* Text-only tile */
            <div
              className="flex h-full flex-col justify-center p-5"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-primary-deep) 0%, var(--brand-primary-soft) 100%)",
              }}
            >
              <p className="line-clamp-5 text-sm font-medium leading-6 text-white/90">
                &ldquo;{quote.text}&rdquo;
              </p>
              {quote.attribution ? (
                <p className="mt-3 text-xs text-white/55">
                  — {quote.attribution}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3">
          <p className="truncate text-xs font-semibold">{quote.title}</p>
          {quote.scriptureReference ? (
            <p className="text-brand-muted mt-0.5 truncate text-xs">
              {quote.scriptureReference}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

interface QuotesPageProps {
  searchParams: Promise<{ search?: string; featured?: string }>;
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const featured = params.featured === "true" ? true : undefined;
  const quotes = await getQuotes({
    search: search || undefined,
    featured,
  });
  const hasFilters = Boolean(search || featured);

  return (
    <section className="space-y-6">
      <div className="site-panel p-5 sm:p-7">
        <p className="eyebrow text-brand-primary">Gallery</p>
        <h1 className="section-title mt-2">Quotes &amp; Reflections</h1>
        <p className="section-copy mt-2">
          Scripture, devotional truth, and words of encouragement drawn from
          the Sabbath Vesper Ministry. Select any card to view the full quote
          and reference.
        </p>
      </div>

      <form className="site-panel grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <div>
          <label htmlFor="quote-search" className="field-label">
            Search quotes
          </label>
          <input
            id="quote-search"
            name="search"
            className="field-input"
            placeholder="Text, scripture, or attribution"
            defaultValue={search}
          />
        </div>
        <div>
          <label htmlFor="quote-featured" className="field-label">
            View
          </label>
          <select
            id="quote-featured"
            name="featured"
            className="field-input"
            defaultValue={featured ? "true" : ""}
          >
            <option value="">All quotes</option>
            <option value="true">Featured only</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="button-primary">
            Filter
          </button>
          {hasFilters ? (
            <a href="/quotes" className="button-tertiary">
              Clear
            </a>
          ) : null}
        </div>
      </form>

      {quotes.length === 0 ? (
        <div className="site-panel p-8 text-center">
          <p className="text-brand-muted text-sm">
            {hasFilters ? "No quotes match your filters." : "No quotes published yet."}
          </p>
          <p className="text-brand-muted mt-1 text-xs">
            {hasFilters
              ? "Try a broader search or clear the filters."
              : "Check back soon — reflections are being added regularly."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((quote) => (
            <li key={quote.id}>
              <QuoteCard quote={quote} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
