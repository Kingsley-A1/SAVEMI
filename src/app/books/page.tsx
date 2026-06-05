import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Download, ShoppingBag } from "lucide-react";
import { getBooks } from "../../lib/books";
import type { Book } from "../../lib/books";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Books & Resources",
  description:
    "Trusted Christian literature curated by the Sabbath Vesper Ministry — free downloads and paid resources for devotional study.",
  openGraph: {
    title: "Books & Resources | SAVEMI",
    description:
      "Trusted Christian literature for devotional study, curated by SAVEMI.",
  },
  alternates: { canonical: "/books" },
};

function AvailabilityBadge({ availability, priceLabel }: { availability: Book["availability"]; priceLabel: string | null }) {
  if (availability === "free") {
    return (
      <span
        className="inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
        style={{ background: "rgba(22,163,74,0.1)", color: "#15803d" }}
      >
        Free
      </span>
    );
  }

  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-xs font-semibold tracking-wide"
      style={{ background: "rgba(217,119,6,0.1)", color: "#b45309" }}
    >
      {priceLabel ?? "Paid"}
    </span>
  );
}

function BookCard({ book }: { book: Book }) {
  const actionIcon =
    book.availability === "free" ? <Download size={14} /> : <ShoppingBag size={14} />;

  return (
    <article className="site-panel flex flex-col overflow-hidden">
      <Link href={`/books/${book.slug}`} className="block group">
        <div
          className="relative aspect-[3/4] w-full overflow-hidden"
          style={{ background: "var(--brand-primary-deep)" }}
        >
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
              alt={`Cover of ${book.title}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen size={42} style={{ color: "rgba(241,231,201,0.5)" }} />
            </div>
          )}

          <div className="absolute left-3 top-3">
            <AvailabilityBadge availability={book.availability} priceLabel={book.priceLabel} />
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {book.format ? <span className="type-badge">{book.format}</span> : null}
          {book.pageCount ? (
            <span className="text-brand-muted text-xs">{book.pageCount} pages</span>
          ) : null}
        </div>
        <Link href={`/books/${book.slug}`} className="group">
          <h2 className="text-base font-semibold leading-snug group-hover:text-brand-primary transition-colors sm:text-lg">
            {book.title}
          </h2>
        </Link>
        <p className="text-brand-primary mt-1 text-xs font-semibold">
          {book.author}
        </p>

        {book.tagline ? (
          <p className="text-brand-muted mt-3 line-clamp-3 text-sm leading-6">
            {book.tagline}
          </p>
        ) : null}

        <div className="mt-auto pt-4">
          {book.availability === "free" ? (
            book.downloadUrl ? (
              <a
                href={book.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary w-full justify-center gap-1.5"
              >
                {actionIcon}
                Download Free
              </a>
            ) : (
              <Link href={`/books/${book.slug}`} className="button-primary w-full justify-center gap-1.5">
                <ArrowRight size={14} />
                View Book
              </Link>
            )
          ) : book.purchaseUrl ? (
            <a
              href={book.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button-primary w-full justify-center gap-1.5"
            >
              {actionIcon}
              {book.priceLabel ? `Buy — ${book.priceLabel}` : "Purchase"}
            </a>
          ) : (
            <Link href={`/books/${book.slug}`} className="button-tertiary w-full justify-center gap-1.5">
              <ArrowRight size={14} />
              View Details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

interface BooksPageProps {
  searchParams: Promise<{ search?: string; availability?: string }>;
}

const availabilityOptions = [
  { label: "All books", value: "" },
  { label: "Free", value: "free" },
  { label: "Paid", value: "paid" },
] as const;

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const availability =
    params.availability === "free" || params.availability === "paid"
      ? params.availability
      : undefined;
  const books = await getBooks({
    search: search || undefined,
    availability,
  });
  const hasFilters = Boolean(search || availability);

  return (
    <section className="space-y-6">
      <div className="site-panel p-5 sm:p-7">
        <p className="eyebrow text-brand-primary">Library</p>
        <h1 className="section-title mt-2">Books &amp; Resources</h1>
        <p className="section-copy mt-2">
          Trusted Christian literature curated for devotional study. Free books
          are available for immediate download. Paid titles link directly to the
          publisher or sales platform.
        </p>
      </div>

      <form className="site-panel grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <div>
          <label htmlFor="book-search" className="field-label">
            Search books
          </label>
          <input
            id="book-search"
            name="search"
            className="field-input"
            placeholder="Title, author, or topic"
            defaultValue={search}
          />
        </div>
        <div>
          <label htmlFor="book-availability" className="field-label">
            Availability
          </label>
          <select
            id="book-availability"
            name="availability"
            className="field-input"
            defaultValue={availability ?? ""}
          >
            {availabilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="button-primary">
            Filter
          </button>
          {hasFilters ? (
            <a href="/books" className="button-tertiary">
              Clear
            </a>
          ) : null}
        </div>
      </form>

      {books.length === 0 ? (
        <div className="site-panel p-8 text-center">
          <p className="text-brand-muted text-sm">
            {hasFilters ? "No books match your filters." : "No books published yet."}
          </p>
          <p className="text-brand-muted mt-1 text-xs">
            {hasFilters
              ? "Try a broader search or clear the filters."
              : "Check back soon — resources are being added regularly."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <li key={book.id}>
              <BookCard book={book} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
