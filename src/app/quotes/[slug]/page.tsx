import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuoteBySlug } from "../../../lib/quotes";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const quote = await getQuoteBySlug(slug);

  if (!quote) {
    return { title: "Quote Not Found" };
  }

  return {
    title: quote.title,
    description: quote.text.slice(0, 155),
    openGraph: {
      title: `${quote.title} | SAVEMI`,
      description: quote.text.slice(0, 155),
      type: "article",
      ...(quote.imageUrl
        ? { images: [{ url: quote.imageUrl, alt: quote.title }] }
        : {}),
    },
    alternates: { canonical: `/quotes/${slug}` },
  };
}

export default async function QuoteDetailPage({ params }: Props) {
  const { slug } = await params;
  const quote = await getQuoteBySlug(slug);

  if (!quote) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-2xl space-y-4">
      {/* Image */}
      {quote.imageUrl ? (
        <div className="site-panel overflow-hidden">
          <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
            <Image
              src={quote.imageUrl}
              alt={quote.title}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      ) : (
        <div
          className="rounded-lg p-8"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-primary-deep) 0%, var(--brand-primary-soft) 100%)",
          }}
        >
          <p className="text-lg font-medium leading-8 text-white/90 sm:text-xl sm:leading-9">
            &ldquo;{quote.text}&rdquo;
          </p>
          {quote.attribution ? (
            <p className="mt-4 text-sm text-white/60">— {quote.attribution}</p>
          ) : null}
        </div>
      )}

      {/* Quote body */}
      <div className="site-panel p-5 sm:p-7">
        <p className="eyebrow text-brand-primary">{quote.title}</p>

        <blockquote className="mt-3 border-l-2 pl-5" style={{ borderColor: "var(--brand-primary)" }}>
          <p className="text-base font-medium leading-8 sm:text-lg sm:leading-9">
            &ldquo;{quote.text}&rdquo;
          </p>
        </blockquote>

        <dl className="text-brand-muted mt-4 flex flex-col gap-1 text-sm">
          {quote.attribution ? (
            <div>
              <dt className="inline font-medium">Attribution: </dt>
              <dd className="inline">{quote.attribution}</dd>
            </div>
          ) : null}
          {quote.scriptureReference ? (
            <div>
              <dt className="inline font-medium">Scripture: </dt>
              <dd className="inline">{quote.scriptureReference}</dd>
            </div>
          ) : null}
          {quote.source ? (
            <div>
              <dt className="inline font-medium">Source: </dt>
              <dd className="inline">{quote.source}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <Link
        href="/quotes"
        className="text-brand-muted hover:text-brand-primary inline-block text-sm transition-colors"
      >
        ← Back to Quotes
      </Link>
    </article>
  );
}
