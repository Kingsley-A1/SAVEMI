import { prisma, isDatabaseConfigured } from "../../../../lib/db";
import Link from "next/link";
import { PlusCircle, Edit2, Eye } from "lucide-react";
import { Suspense } from "react";
import AdminFilterBar from "../../../../components/AdminFilterBar";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; featured?: string }>;
}

async function getAdminQuotes(filters: { search?: string; status?: string; featured?: string }) {
  if (!isDatabaseConfigured()) return [];
  try {
    return await prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      where: {
        ...(filters.status && { status: filters.status as "PUBLISHED" | "DRAFT" | "ARCHIVED" }),
        ...(filters.featured === "true" && { featured: true }),
        ...(filters.search && {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { text: { contains: filters.search, mode: "insensitive" } },
            { attribution: { contains: filters.search, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true, slug: true, title: true, attribution: true,
        scriptureReference: true, featured: true,
        status: true, publishedAt: true, createdAt: true,
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

export default async function AdminQuotesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const quotes = await getAdminQuotes(params);
  const activeFilters = Object.values(params).some(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Quotes</h1>
          <p className="text-brand-muted mt-1 text-sm">
            {quotes.length} {activeFilters ? "matching" : "total"} {quotes.length !== 1 ? "quotes" : "quote"}
          </p>
        </div>
        <Link href="/admin/quotes/new" className="button-primary flex items-center gap-1.5">
          <PlusCircle size={14} /> New Quote
        </Link>
      </div>

      {/* Filter bar */}
      <Suspense>
        <AdminFilterBar
          search={params.search ?? ""}
          searchPlaceholder="Search by title or attribution…"
          exportUrl="/api/admin/export?type=quotes"
          filters={[
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
              name: "featured",
              placeholder: "All quotes",
              value: params.featured ?? "",
              options: [
                { label: "Featured only", value: "true" },
              ],
            },
          ]}
        />
      </Suspense>

      {/* Table */}
      <div className="site-panel overflow-hidden">
        {quotes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-brand-muted text-sm">
              {activeFilters ? "No quotes match your filters." : "No quotes yet."}
            </p>
            {!activeFilters && (
              <Link href="/admin/quotes/new" className="button-primary mt-3 inline-flex items-center gap-1.5">
                <PlusCircle size={14} /> Add your first quote
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="divide-y md:hidden">
              {quotes.map((quote) => (
                <div key={quote.id} className="space-y-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{quote.title}</p>
                      {quote.attribution && (
                        <p className="text-brand-muted mt-0.5 text-xs">{quote.attribution}</p>
                      )}
                    </div>
                    <span className="text-brand-muted shrink-0 text-xs">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-block rounded px-2 py-0.5 font-semibold" style={STATUS_STYLE[quote.status]}>
                      {quote.status}
                    </span>
                    {quote.featured && <span className="type-badge">Featured</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/quotes/${quote.slug}`} className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs" target="_blank">
                      <Eye size={14} /> Preview
                    </Link>
                    <Link href={`/admin/quotes/${quote.id}/edit`} className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs">
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
                    {["Title", "Attribution", "Scripture", "Status", "Created", "Actions"].map((h) => (
                      <th key={h} className="text-brand-muted px-5 py-3 text-xs font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--brand-border)" }}>
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold">{quote.title}</p>
                        {quote.featured && <span className="type-badge mt-0.5 text-[10px]">Featured</span>}
                      </td>
                      <td className="text-brand-muted px-5 py-3">{quote.attribution ?? "—"}</td>
                      <td className="text-brand-muted px-5 py-3 text-xs">{quote.scriptureReference ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold" style={STATUS_STYLE[quote.status]}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="text-brand-muted px-5 py-3 text-xs">{new Date(quote.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/quotes/${quote.slug}`} className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs" target="_blank">
                            <Eye size={13} /> Preview
                          </Link>
                          <Link href={`/admin/quotes/${quote.id}/edit`} className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs">
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
