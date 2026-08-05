import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Download,
  Feather,
  Mic,
  Newspaper,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getResources,
  RESOURCE_TYPE_LABEL,
  RESOURCE_TYPE_ORDER,
} from "../../lib/resources";
import type { Resource, ResourceType } from "../../lib/resources";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Trusted Christian resources curated by the Sabbath Vesper Ministry — books, devotionals, pastor's pulpit messages, and articles for devotional study.",
  openGraph: {
    title: "Resources | SAVEMI",
    description:
      "Books, devotionals, pastor's pulpit messages, and articles for devotional study, curated by SAVEMI.",
  },
  alternates: { canonical: "/resources" },
};

const TYPE_ICON: Record<ResourceType, LucideIcon> = {
  book: BookOpen,
  devotional: Sparkles,
  pulpit: Mic,
  article: Newspaper,
};

const TYPE_DESCRIPTION: Record<ResourceType, string> = {
  book: "Full-length titles for devotional study — free downloads and paid resources.",
  devotional: "Short daily readings to steady the heart before the day begins.",
  pulpit: "Messages preached from the pulpit, kept here for those who missed them.",
  article: "Shorter reflections on scripture, faith, and Sabbath living.",
};

function AvailabilityBadge({
  availability,
  priceLabel,
}: {
  availability: Resource["availability"];
  priceLabel: string | null;
}) {
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

function ResourceCard({ resource }: { resource: Resource }) {
  const actionIcon =
    resource.availability === "free" ? <Download size={14} /> : <ShoppingBag size={14} />;
  const TypeIcon = TYPE_ICON[resource.resourceType];

  return (
    <article className="site-panel flex flex-col overflow-hidden">
      <Link href={`/resources/${resource.slug}`} className="block group">
        <div
          className="relative aspect-[3/4] w-full overflow-hidden"
          style={{ background: "var(--brand-primary-deep)" }}
        >
          {resource.coverImageUrl ? (
            <Image
              src={resource.coverImageUrl}
              alt={`Cover of ${resource.title}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <TypeIcon size={42} style={{ color: "rgba(241,231,201,0.5)" }} />
            </div>
          )}

          <div className="absolute left-3 top-3">
            <AvailabilityBadge availability={resource.availability} priceLabel={resource.priceLabel} />
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <div className="mb-1.5 flex flex-wrap items-center gap-1 sm:mb-2 sm:gap-2">
          {resource.format ? (
            <span className="type-badge px-1.5 py-0.5 text-[10px] sm:px-2 sm:text-xs">
              {resource.format}
            </span>
          ) : null}
          {resource.pageCount ? (
            <span className="text-brand-muted text-[10px] sm:text-xs">
              {resource.pageCount} pages
            </span>
          ) : null}
        </div>
        <Link href={`/resources/${resource.slug}`} className="group">
          <h3 className="text-sm font-semibold leading-snug group-hover:text-brand-primary transition-colors sm:text-base lg:text-lg">
            {resource.title}
          </h3>
        </Link>
        <p className="text-brand-primary mt-1 text-[11px] font-semibold sm:text-xs">
          {resource.author}
        </p>

        {resource.tagline ? (
          <p className="text-brand-muted mt-2 line-clamp-2 text-xs leading-5 sm:mt-3 sm:line-clamp-3 sm:text-sm sm:leading-6">
            {resource.tagline}
          </p>
        ) : null}

        <div className="mt-auto pt-3 sm:pt-4">
          {resource.availability === "free" ? (
            resource.downloadUrl ? (
              // Hosted files stream from this site under the resource title;
              // external links open where they live.
              <a
                href={resource.downloadUrl}
                target={resource.hostedDownload ? undefined : "_blank"}
                rel={resource.hostedDownload ? undefined : "noopener noreferrer"}
                className="button-primary w-full justify-center gap-1 px-2 py-1.5 text-xs sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
                aria-label={`Download ${resource.title}`}
              >
                {actionIcon}
                Download Free
              </a>
            ) : (
              <Link
                href={`/resources/${resource.slug}`}
                className="button-primary w-full justify-center gap-1 px-2 py-1.5 text-xs sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
              >
                <ArrowRight size={14} />
                View
              </Link>
            )
          ) : resource.purchaseUrl ? (
            <a
              href={resource.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button-primary w-full justify-center gap-1 px-2 py-1.5 text-xs sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
            >
              {actionIcon}
              {resource.priceLabel ? `Buy — ${resource.priceLabel}` : "Purchase"}
            </a>
          ) : (
            <Link
              href={`/resources/${resource.slug}`}
              className="button-tertiary w-full justify-center gap-1 px-2 py-1.5 text-xs sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
            >
              <ArrowRight size={14} />
              View Details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function SectionEmptyState({ resourceType }: { resourceType: ResourceType }) {
  const TypeIcon = TYPE_ICON[resourceType];

  return (
    <div className="site-panel flex flex-col items-center gap-2 p-8 text-center">
      <TypeIcon size={26} style={{ color: "var(--brand-primary-soft)" }} aria-hidden="true" />
      <p className="text-brand-muted text-sm">
        No {RESOURCE_TYPE_LABEL[resourceType].toLowerCase()} published yet.
      </p>
      <p className="text-brand-muted text-xs">Check back soon — more is on the way.</p>
    </div>
  );
}

function WholeLibraryEmptyState() {
  return (
    <div className="site-panel flex flex-col items-center gap-3 p-10 text-center sm:p-14">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "rgba(10,79,60,0.08)" }}
      >
        <Feather size={26} style={{ color: "var(--brand-primary)" }} aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold">The library is being prepared</h2>
      <p className="text-brand-muted max-w-md text-sm leading-6">
        Books, devotionals, pastor&apos;s pulpit messages, and articles will
        appear here as they are published. Check back soon.
      </p>
    </div>
  );
}

interface ResourcesPageProps {
  searchParams: Promise<{ search?: string; availability?: string }>;
}

const availabilityOptions = [
  { label: "All resources", value: "" },
  { label: "Free", value: "free" },
  { label: "Paid", value: "paid" },
] as const;

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const availability =
    params.availability === "free" || params.availability === "paid"
      ? params.availability
      : undefined;
  const hasFilters = Boolean(search || availability);

  // One query, grouped client-side by type — avoids four round trips for the
  // common case of a modest library.
  const matches = await getResources({
    search: search || undefined,
    availability,
    limit: 200,
  });

  const byType = RESOURCE_TYPE_ORDER.reduce(
    (acc, type) => {
      acc[type] = matches.filter((resource) => resource.resourceType === type);
      return acc;
    },
    {} as Record<ResourceType, Resource[]>,
  );

  const totalMatches = matches.length;

  return (
    <section className="space-y-6">
      <div className="site-panel p-5 sm:p-7">
        <p className="eyebrow text-brand-primary">Library</p>
        <h1 className="section-title mt-2">Resources</h1>
        <p className="section-copy mt-2">
          Books, devotionals, pastor&apos;s pulpit messages, and articles
          curated for devotional study. Free items download in one click;
          paid titles link to where they can be purchased.
        </p>
      </div>

      <form className="site-panel grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <div>
          <label htmlFor="resource-search" className="field-label">
            Search resources
          </label>
          <input
            id="resource-search"
            name="search"
            className="field-input"
            placeholder="Title, author, or topic"
            defaultValue={search}
          />
        </div>
        <div>
          <label htmlFor="resource-availability" className="field-label">
            Availability
          </label>
          <select
            id="resource-availability"
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
            <a href="/resources" className="button-tertiary">
              Clear
            </a>
          ) : null}
        </div>
      </form>

      {totalMatches === 0 && !hasFilters ? (
        <WholeLibraryEmptyState />
      ) : totalMatches === 0 ? (
        <div className="site-panel p-8 text-center">
          <p className="text-brand-muted text-sm">No resources match your filters.</p>
          <p className="text-brand-muted mt-1 text-xs">
            Try a broader search or clear the filters.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {RESOURCE_TYPE_ORDER.map((type) => {
            const items = byType[type];
            const TypeIcon = TYPE_ICON[type];

            return (
              <div key={type} id={type} className="space-y-3 scroll-mt-20">
                <div className="flex items-baseline gap-2.5">
                  <TypeIcon size={18} style={{ color: "var(--brand-primary)" }} aria-hidden="true" />
                  <h2 className="text-lg font-semibold sm:text-xl">
                    {RESOURCE_TYPE_LABEL[type]}
                  </h2>
                  <span className="text-brand-muted text-xs">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <p className="text-brand-muted -mt-1.5 text-sm">
                  {TYPE_DESCRIPTION[type]}
                </p>

                {items.length === 0 ? (
                  <SectionEmptyState resourceType={type} />
                ) : (
                  <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {items.map((resource) => (
                      <li key={resource.id}>
                        <ResourceCard resource={resource} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
