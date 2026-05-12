import { prisma, isDatabaseConfigured } from "../../../lib/db";
import Link from "next/link";
import { PlusCircle, Edit2, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

async function getAdminBooks() {
  if (!isDatabaseConfigured()) return [];
  try {
    return await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        author: true,
        availability: true,
        status: true,
        featured: true,
        publishedAt: true,
        createdAt: true,
      },
    });
  } catch {
    return [];
  }
}

const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: "background:rgba(22,163,74,0.1);color:#15803d",
  DRAFT: "background:rgba(217,119,6,0.1);color:#b45309",
  ARCHIVED: "background:rgba(100,116,139,0.1);color:#475569",
};

const AVAILABILITY_STYLE: Record<string, string> = {
  FREE: "background:rgba(22,163,74,0.08);color:#15803d",
  PAID: "background:rgba(217,119,6,0.08);color:#b45309",
};

function parseBadgeStyle(style: string): Record<string, string> {
  return Object.fromEntries(
    style
      .split(";")
      .filter(Boolean)
      .map((s) => s.split(":").map((v) => v.trim())),
  );
}

export default async function AdminBooksPage() {
  const books = await getAdminBooks();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Books</h1>
          <p className="text-brand-muted mt-1 text-sm">
            {books.length} total {books.length === 1 ? "book" : "books"}
          </p>
        </div>
        <Link
          href="/admin/books/new"
          className="button-primary flex items-center gap-1.5"
        >
          <PlusCircle size={14} />
          New Book
        </Link>
      </div>

      <div className="site-panel overflow-hidden">
        {books.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-brand-muted text-sm">No books yet.</p>
            <Link
              href="/admin/books/new"
              className="button-primary mt-3 inline-flex items-center gap-1.5"
            >
              <PlusCircle size={14} />
              Add your first book
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="divide-y md:hidden">
              {books.map((book) => (
                <div key={book.id} className="space-y-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{book.title}</p>
                      <p className="text-brand-muted mt-0.5 text-xs">{book.author}</p>
                    </div>
                    <span className="text-brand-muted shrink-0 text-xs">
                      {new Date(book.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span
                      className="inline-block rounded px-2 py-0.5 font-semibold"
                      style={parseBadgeStyle(AVAILABILITY_STYLE[book.availability] ?? "")}
                    >
                      {book.availability}
                    </span>
                    <span
                      className="inline-block rounded px-2 py-0.5 font-semibold"
                      style={parseBadgeStyle(STATUS_STYLE[book.status] ?? "")}
                    >
                      {book.status}
                    </span>
                    {book.featured ? (
                      <span className="type-badge">Featured</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/books/${book.slug}`}
                      className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs"
                      target="_blank"
                    >
                      <Eye size={14} /> Preview
                    </Link>
                    <Link
                      href={`/admin/books/${book.id}/edit`}
                      className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs"
                    >
                      <Edit2 size={14} /> Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left" style={{ borderColor: "var(--brand-border)" }}>
                    <th className="text-brand-muted px-5 py-3 text-xs font-medium">Title</th>
                    <th className="text-brand-muted px-5 py-3 text-xs font-medium">Author</th>
                    <th className="text-brand-muted px-5 py-3 text-xs font-medium">Availability</th>
                    <th className="text-brand-muted px-5 py-3 text-xs font-medium">Status</th>
                    <th className="text-brand-muted px-5 py-3 text-xs font-medium">Created</th>
                    <th className="text-brand-muted px-5 py-3 text-xs font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--brand-border)" }}>
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold">{book.title}</p>
                        {book.featured ? (
                          <span className="type-badge mt-0.5 text-[10px]">Featured</span>
                        ) : null}
                      </td>
                      <td className="text-brand-muted px-5 py-3">{book.author}</td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-block rounded px-2 py-0.5 text-xs font-semibold"
                          style={parseBadgeStyle(AVAILABILITY_STYLE[book.availability] ?? "")}
                        >
                          {book.availability}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-block rounded px-2 py-0.5 text-xs font-semibold"
                          style={parseBadgeStyle(STATUS_STYLE[book.status] ?? "")}
                        >
                          {book.status}
                        </span>
                      </td>
                      <td className="text-brand-muted px-5 py-3 text-xs">
                        {new Date(book.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/books/${book.slug}`}
                            className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs"
                            target="_blank"
                          >
                            <Eye size={13} /> Preview
                          </Link>
                          <Link
                            href={`/admin/books/${book.id}/edit`}
                            className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs"
                          >
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
