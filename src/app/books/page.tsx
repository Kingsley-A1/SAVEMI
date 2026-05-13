import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
              <span className="text-xs font-semibold uppercase tracking-widest opacity-40" style={{ color: "var(--brand-accent)" }}>
                {book.format ?? "Book"}
              </span>
            </div>
          )}

          <div className="absolute left-3 top-3">
            <AvailabilityBadge availability={book.availability} priceLabel={book.priceLabel} />
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/books/${book.slug}`} className="group">
          <h2 className="text-sm font-semibold leading-snug group-hover:text-brand-primary transition-colors sm:text-base">
            {book.title}
          </h2>
        </Link>
        <p className="text-brand-muted mt-0.5 text-xs">{book.author}</p>

        {book.tagline ? (
          <p className="text-brand-muted mt-2 line-clamp-2 text-xs leading-5">
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
                className="button-primary w-full justify-center"
              >
                Download Free
              </a>
            ) : (
              <Link href={`/books/${book.slug}`} className="button-primary w-full justify-center">
                View Book
              </Link>
            )
          ) : book.purchaseUrl ? (
            <a
              href={book.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button-tertiary w-full justify-center"
            >
              {book.priceLabel ? `Buy — ${book.priceLabel}` : "Purchase"}
            </a>
          ) : (
            <Link href={`/books/${book.slug}`} className="button-tertiary w-full justify-center">
              View Details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function BooksPage() {
  const books = await getBooks();

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

      {books.length === 0 ? (
        <div className="site-panel p-8 text-center">
          <p className="text-brand-muted text-sm">No books published yet.</p>
          <p className="text-brand-muted mt-1 text-xs">
            Check back soon — resources are being added regularly.
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
