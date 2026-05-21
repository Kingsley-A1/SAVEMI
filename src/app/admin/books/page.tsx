import { prisma, isDatabaseConfigured } from "../../../lib/db";
import Link from "next/link";
import { PlusCircle, Edit2, Eye } from "lucide-react";
import { Suspense } from "react";
import AdminFilterBar from "../../../components/AdminFilterBar";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; availability?: string }>;
}

async function getAdminBooks(filters: { search?: string; status?: string; availability?: string }) {
  if (!isDatabaseConfigured()) return [];
  try {
    return await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      where: {
        ...(filters.status && { status: filters.status as "PUBLISHED" | "DRAFT" | "ARCHIVED" }),
        ...(filters.availability && { availability: filters.availability as "FREE" | "PAID" }),
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
        availability: true, status: true, featured: true,
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

export default async function AdminBooksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const books = await getAdminBooks(params);
  const activeFilters = Object.values(params).some(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Books</h1>
          <p className="text-brand-muted mt-1 text-sm">
            {books.length} {activeFilters ? "matching" : "total"} {books.length !== 1 ? "books" : "book"}
          </p>
        </div>
        <Link href="/admin/books/new" className="button-primary flex items-center gap-1.5">
          <PlusCircle size={14} /> New Book
        </Link>
      </div>

      {/* Filter bar */}
      <Suspense>
        <AdminFilterBar
          search={params.search ?? ""}
          searchPlaceholder="Search by title or author…"
          exportUrl="/api/admin/export?type=books"
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
        {books.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-brand-muted text-sm">
              {activeFilters ? "No books match your filters." : "No books yet."}
            </p>
            {!activeFilters && (
              <Link href="/admin/books/new" className="button-primary mt-3 inline-flex items-center gap-1.5">
                <PlusCircle size={14} /> Add your first book
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="divide-y md:hidden">
              {books.map((book) => (
                <div key={book.id} className="space-y-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{book.title}</p>
                      <p className="text-brand-muted mt-0.5 text-xs">{book.author}</p>
                    </div>
                    <span className="text-brand-muted shrink-0 text-xs">{new Date(book.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-block rounded px-2 py-0.5 font-semibold" style={AVAILABILITY_STYLE[book.availability]}>
                      {book.availability}
                    </span>
                    <span className="inline-block rounded px-2 py-0.5 font-semibold" style={STATUS_STYLE[book.status]}>
                      {book.status}
                    </span>
                    {book.featured && <span className="type-badge">Featured</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/books/${book.slug}`} className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs" target="_blank">
                      <Eye size={14} /> Preview
                    </Link>
                    <Link href={`/admin/books/${book.id}/edit`} className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs">
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
                    {["Title", "Author", "Availability", "Status", "Created", "Actions"].map((h) => (
                      <th key={h} className="text-brand-muted px-5 py-3 text-xs font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--brand-border)" }}>
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold">{book.title}</p>
                        {book.featured && <span className="type-badge mt-0.5 text-[10px]">Featured</span>}
                      </td>
                      <td className="text-brand-muted px-5 py-3">{book.author}</td>
                      <td className="px-5 py-3">
                        <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold" style={AVAILABILITY_STYLE[book.availability]}>
                          {book.availability}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold" style={STATUS_STYLE[book.status]}>
                          {book.status}
                        </span>
                      </td>
                      <td className="text-brand-muted px-5 py-3 text-xs">{new Date(book.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/books/${book.slug}`} className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs" target="_blank">
                            <Eye size={13} /> Preview
                          </Link>
                          <Link href={`/admin/books/${book.id}/edit`} className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs">
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
