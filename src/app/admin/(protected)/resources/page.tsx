import { prisma, isDatabaseConfigured } from "../../../../lib/db";
import Link from "next/link";
import { PlusCircle, Edit2, Eye } from "lucide-react";
import { Suspense } from "react";
import AdminFilterBar from "../../../../components/AdminFilterBar";
import { RESOURCE_TYPE_LABEL } from "../../../../lib/resources";
import type { ResourceType } from "../../../../lib/resources";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    availability?: string;
    resourceType?: string;
  }>;
}

async function getAdminResources(filters: {
  search?: string;
  status?: string;
  availability?: string;
  resourceType?: string;
}) {
  if (!isDatabaseConfigured()) return [];
  try {
    return await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      where: {
        ...(filters.status && { status: filters.status as "PUBLISHED" | "DRAFT" | "ARCHIVED" }),
        ...(filters.availability && { availability: filters.availability as "FREE" | "PAID" }),
        ...(filters.resourceType && {
          resourceType: filters.resourceType as "BOOK" | "DEVOTIONAL" | "PULPIT" | "ARTICLE",
        }),
        ...(filters.search && {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { author: { contains: filters.search, mode: "insensitive" } },
            { tagline: { contains: filters.search, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true, slug: true, title: true, author: true,
        availability: true, resourceType: true, status: true, featured: true,
        publishedAt: true, createdAt: true,
      },
    });
  } catch {
    return [];
  }
}

const STATUS_STYLE: Record<string, { background: string; color: string }> = {
  PUBLISHED: { background: "rgba(22,163,74,0.1)", color: "#15803d" },
  DRAFT: { background: "rgba(217,119,6,0.1)", color: "#b45309" },
  ARCHIVED: { background: "rgba(100,116,139,0.1)", color: "#475569" },
};

const AVAILABILITY_STYLE: Record<string, { background: string; color: string }> = {
  FREE: { background: "rgba(22,163,74,0.08)", color: "#15803d" },
  PAID: { background: "rgba(217,119,6,0.08)", color: "#b45309" },
};

function resourceTypeLabel(value: string): string {
  return RESOURCE_TYPE_LABEL[value.toLowerCase() as ResourceType] ?? value;
}

export default async function AdminResourcesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const resources = await getAdminResources(params);
  const activeFilters = Object.values(params).some(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resources</h1>
          <p className="text-brand-muted mt-1 text-sm">
            {resources.length} {activeFilters ? "matching" : "total"} {resources.length !== 1 ? "resources" : "resource"}
          </p>
        </div>
        <Link href="/admin/resources/new" className="button-primary flex items-center gap-1.5">
          <PlusCircle size={14} /> New Resource
        </Link>
      </div>

      {/* Filter bar */}
      <Suspense>
        <AdminFilterBar
          search={params.search ?? ""}
          searchPlaceholder="Search by title or author…"
          exportUrl="/api/admin/export?type=resources"
          filters={[
            {
              name: "resourceType",
              placeholder: "All types",
              value: params.resourceType ?? "",
              options: [
                { label: "Books", value: "BOOK" },
                { label: "Devotionals", value: "DEVOTIONAL" },
                { label: "Pastor's Pulpit", value: "PULPIT" },
                { label: "Articles", value: "ARTICLE" },
              ],
            },
            {
              name: "status",
              placeholder: "All statuses",
              value: params.status ?? "",
              options: [
                { label: "Published", value: "PUBLISHED" },
                { label: "Draft", value: "DRAFT" },
                { label: "Archived", value: "ARCHIVED" },
              ],
            },
            {
              name: "availability",
              placeholder: "All availability",
              value: params.availability ?? "",
              options: [
                { label: "Free", value: "FREE" },
                { label: "Paid", value: "PAID" },
              ],
            },
          ]}
        />
      </Suspense>

      {/* Table */}
      <div className="site-panel overflow-hidden">
        {resources.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-brand-muted text-sm">
              {activeFilters ? "No resources match your filters." : "No resources yet."}
            </p>
            {!activeFilters && (
              <Link href="/admin/resources/new" className="button-primary mt-3 inline-flex items-center gap-1.5">
                <PlusCircle size={14} /> Add your first resource
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="divide-y md:hidden">
              {resources.map((resource) => (
                <div key={resource.id} className="space-y-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{resource.title}</p>
                      <p className="text-brand-muted mt-0.5 text-xs">{resource.author}</p>
                    </div>
                    <span className="text-brand-muted shrink-0 text-xs">{new Date(resource.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="type-badge">{resourceTypeLabel(resource.resourceType)}</span>
                    <span className="inline-block rounded px-2 py-0.5 font-semibold" style={AVAILABILITY_STYLE[resource.availability]}>
                      {resource.availability}
                    </span>
                    <span className="inline-block rounded px-2 py-0.5 font-semibold" style={STATUS_STYLE[resource.status]}>
                      {resource.status}
                    </span>
                    {resource.featured && <span className="type-badge">Featured</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/resources/${resource.slug}`} className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs" target="_blank">
                      <Eye size={14} /> Preview
                    </Link>
                    <Link href={`/admin/resources/${resource.id}/edit`} className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs">
                      <Edit2 size={14} /> Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left" style={{ borderColor: "var(--brand-border)" }}>
                    {["Title", "Type", "Author", "Availability", "Status", "Created", "Actions"].map((h) => (
                      <th key={h} className="text-brand-muted px-5 py-3 text-xs font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--brand-border)" }}>
                  {resources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold">{resource.title}</p>
                        {resource.featured && <span className="type-badge mt-0.5 text-[10px]">Featured</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className="type-badge">{resourceTypeLabel(resource.resourceType)}</span>
                      </td>
                      <td className="text-brand-muted px-5 py-3">{resource.author}</td>
                      <td className="px-5 py-3">
                        <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold" style={AVAILABILITY_STYLE[resource.availability]}>
                          {resource.availability}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold" style={STATUS_STYLE[resource.status]}>
                          {resource.status}
                        </span>
                      </td>
                      <td className="text-brand-muted px-5 py-3 text-xs">{new Date(resource.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/resources/${resource.slug}`} className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs" target="_blank">
                            <Eye size={13} /> Preview
                          </Link>
                          <Link href={`/admin/resources/${resource.id}/edit`} className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs">
                            <Edit2 size={13} /> Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
