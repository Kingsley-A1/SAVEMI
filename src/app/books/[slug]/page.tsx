import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookBySlug } from "../../../lib/books";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    return { title: "Book Not Found" };
  }

  return {
    title: book.title,
    description: book.tagline || book.description?.slice(0, 155),
    openGraph: {
      title: `${book.title} | SAVEMI`,
      description: book.tagline || book.description?.slice(0, 155),
      type: "article",
      ...(book.coverImageUrl
        ? { images: [{ url: book.coverImageUrl, alt: book.title }] }
        : {}),
    },
    alternates: { canonical: `/books/${slug}` },
  };
}

export default async function BookDetailPage({ params }: Props) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  const isFree = book.availability === "free";

  return (
    <article className="mx-auto max-w-4xl space-y-4">
      {/* Header */}
      <div className="site-panel p-5 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Cover */}
          <div
            className="relative mx-auto w-full max-w-[200px] shrink-0 overflow-hidden rounded-lg sm:mx-0"
            style={{
              aspectRatio: "3/4",
              background: "var(--brand-primary-deep)",
              minWidth: 160,
            }}
          >
            {book.coverImageUrl ? (
              <Image
                src={book.coverImageUrl}
                alt={`Cover of ${book.title}`}
                fill
                sizes="200px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span
                  className="px-3 text-center text-xs font-semibold uppercase tracking-widest opacity-50"
                  style={{ color: "var(--brand-accent)" }}
                >
                  {book.format ?? "Book"}
                </span>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {isFree ? (
                <span
                  className="inline-block rounded px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
                  style={{ background: "rgba(22,163,74,0.1)", color: "#15803d" }}
                >
                  Free Download
                </span>
              ) : (
                <span
                  className="inline-block rounded px-2.5 py-0.5 text-xs font-semibold tracking-wide"
                  style={{ background: "rgba(217,119,6,0.1)", color: "#b45309" }}
                >
                  {book.priceLabel ?? "Paid"}
                </span>
              )}
              {book.format ? (
                <span className="type-badge">{book.format}</span>
              ) : null}
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {book.title}
            </h1>

            {book.tagline ? (
              <p className="text-brand-muted text-sm leading-6 sm:text-base">
                {book.tagline}
              </p>
            ) : null}

            <dl className="text-brand-muted flex flex-col gap-1 text-sm">
              <div>
                <dt className="inline font-medium">Author: </dt>
                <dd className="inline">{book.author}</dd>
              </div>
              {book.pageCount ? (
                <div>
                  <dt className="inline font-medium">Pages: </dt>
                  <dd className="inline">{book.pageCount}</dd>
                </div>
              ) : null}
            </dl>

            {/* CTA */}
            <div className="flex flex-wrap gap-3 pt-2">
              {isFree ? (
                book.downloadUrl ? (
                  <a
                    href={book.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-primary"
                  >
                    Download Free
                  </a>
                ) : (
                  <span className="button-primary opacity-60 cursor-not-allowed">
                    Download coming soon
                  </span>
                )
              ) : book.purchaseUrl ? (
                <a
                  href={book.purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-primary"
                >
                  {book.priceLabel ? `Buy — ${book.priceLabel}` : "Purchase Book"}
                </a>
              ) : null}
              <Link href="/books" className="button-tertiary">
                ← Back to Library
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {book.description ? (
        <div className="site-panel p-5 sm:p-7">
          <h2 className="eyebrow text-brand-primary">About This Book</h2>
          <p className="text-brand-muted mt-3 whitespace-pre-line text-sm leading-7">
            {book.description}
          </p>
        </div>
      ) : null}

      <Link
        href="/books"
        className="text-brand-muted hover:text-brand-primary inline-block text-sm transition-colors"
      >
        ← Back to Library
      </Link>
    </article>
  );
}
