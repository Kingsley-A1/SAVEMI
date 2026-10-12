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
import { LibraryHeader } from "../../components/MessageTypeLibrary";
import AutoSubmitSelect from "../../components/AutoSubmitSelect";

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
              quality={90}
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

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link href={`/resources/${resource.slug}`} className="group">
          <h3 className="text-sm font-semibold leading-snug group-hover:text-brand-primary transition-colors sm:text-base lg:text-lg">
            {resource.title}
          </h3>
        </Link>
        <p className="text-brand-primary mt-1 text-[11px] font-semibold sm:text-xs">
          {resource.author}
        </p>

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

function WholeLibraryEmptyState() {
  return (
    <div className="site-panel flex flex-col items-center gap-3 p-10 text-center sm:p-14">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "rgba(10,79,60,0.08)" }}
      >
        <Feather size={26} style={{ color: "var(--brand-primary)" }} aria-hidden="true" />
      </div>
      <p className="text-brand-muted text-sm">Resources will appear here soon.</p>
    </div>
  );
}

interface ResourcesPageProps {
  searchParams: Promise<{ search?: string; availability?: string }>;
}

const availabilityOptions = [
  { label: "All", value: "" },
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
      <LibraryHeader
        title="Resources"
        path="/resources"
        search={search}
        searchLabel="Search resources"
      >
        <AutoSubmitSelect
          name="availability"
          aria-label="Availability"
          className="field-input w-auto shrink-0"
          defaultValue={availability ?? ""}
        >
          {availabilityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AutoSubmitSelect>
      </LibraryHeader>

      {totalMatches === 0 && !hasFilters ? (
        <WholeLibraryEmptyState />
      ) : totalMatches === 0 ? (
        <div className="site-panel p-8 text-center">
          <p className="text-brand-muted text-sm">No resources match.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {RESOURCE_TYPE_ORDER.map((type) => {
            const items = byType[type];
            const TypeIcon = TYPE_ICON[type];
            if (items.length === 0) return null;

            return (
              <div key={type} id={type} className="space-y-3 scroll-mt-20">
                <div className="flex items-center gap-2.5">
                  <TypeIcon size={18} style={{ color: "var(--brand-primary)" }} aria-hidden="true" />
                  <h2 className="text-lg font-semibold sm:text-xl">
                    {RESOURCE_TYPE_LABEL[type]}
                  </h2>
                </div>

                <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {items.map((resource) => (
                      <li key={resource.id}>
                        <ResourceCard resource={resource} />
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
