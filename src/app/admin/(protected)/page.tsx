import { prisma, isDatabaseConfigured } from "../../../lib/db";
import Link from "next/link";
import { auth } from "../../../../auth";
import { isSuperAdminEmail } from "../../../lib/admin-permissions";
import {
  MessageSquare,
  Mail,
  FileEdit,
  PlusCircle,
  UserPlus,
  Clapperboard,
  BookOpen,
  Quote,
  Activity,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
  if (!isDatabaseConfigured()) {
    return {
      total: 0, published: 0, drafts: 0, contacts: 0,
      totalBooks: 0, publishedBooks: 0, totalQuotes: 0, publishedQuotes: 0,
      admins: 0, auditEvents: 0,
    };
  }
  try {
    const [
      total,
      published,
      drafts,
      contacts,
      totalBooks,
      publishedBooks,
      totalQuotes,
      publishedQuotes,
      admins,
    ] = await Promise.all([
      prisma.message.count(),
      prisma.message.count({ where: { status: "PUBLISHED" } }),
      prisma.message.count({ where: { status: "DRAFT" } }),
      prisma.contactSubmission.count(),
      prisma.book.count(),
      prisma.book.count({ where: { status: "PUBLISHED" } }),
      prisma.quote.count(),
      prisma.quote.count({ where: { status: "PUBLISHED" } }),
      prisma.adminUser.count(),
    ]);
    let auditEvents = 0;
    try {
      auditEvents = await prisma.auditLog.count();
    } catch {
      auditEvents = 0;
    }

    return { total, published, drafts, contacts, totalBooks, publishedBooks, totalQuotes, publishedQuotes, admins, auditEvents };
  } catch {
    return {
      total: 0, published: 0, drafts: 0, contacts: 0,
      totalBooks: 0, publishedBooks: 0, totalQuotes: 0, publishedQuotes: 0,
      admins: 0, auditEvents: 0,
    };
  }
}

export default async function AdminDashboard() {
  const session = await auth();
  const isSuperAdmin = isSuperAdminEmail(session?.user?.email);
  const stats = await getStats();

  const cards = [
    {
      label: "Total Messages",
      value: stats.total,
      icon: MessageSquare,
      color: "var(--brand-primary)",
      href: "/admin/messages",
    },
    {
      label: "Published",
      value: stats.published,
      icon: FileEdit,
      color: "#16a34a",
      href: "/admin/messages?status=PUBLISHED",
    },
    {
      label: "Drafts",
      value: stats.drafts,
      icon: FileEdit,
      color: "#d97706",
      href: "/admin/messages?status=DRAFT",
    },
    {
      label: "Contact Submissions",
      value: stats.contacts,
      icon: Mail,
      color: "#0369a1",
      href: "/admin/contacts",
    },
    {
      label: "Total Books",
      value: stats.totalBooks,
      icon: BookOpen,
      color: "var(--brand-primary-soft)",
      href: "/admin/books",
    },
    {
      label: "Published Books",
      value: stats.publishedBooks,
      icon: BookOpen,
      color: "#16a34a",
      href: "/admin/books", // Books page doesn't currently support status filter, just link to books
    },
    {
      label: "Total Quotes",
      value: stats.totalQuotes,
      icon: Quote,
      color: "#7c3aed",
      href: "/admin/quotes",
    },
    {
      label: "Published Quotes",
      value: stats.publishedQuotes,
      icon: Quote,
      color: "#16a34a",
      href: "/admin/quotes", // Quotes page doesn't currently support status filter
    },
    {
      label: "Admin Users",
      value: stats.admins,
      icon: Users,
      color: "#0f766e",
      href: "/admin/admin-users",
    },
    {
      label: "Audit Events",
      value: stats.auditEvents,
      icon: Activity,
      color: "#475569",
      href: "/admin/health",
    },
  ].filter((card) => isSuperAdmin || card.href !== "/admin/admin-users");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-brand-muted mt-1 text-sm">
          Welcome back. Overview of the ministry content.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="site-panel block p-4 transition-colors hover:bg-black/5">
            <div className="flex items-center justify-between">
              <p className="text-brand-muted min-w-0 pr-2 text-xs font-medium leading-snug">{label}</p>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="site-panel p-5">
        <h2 className="mb-3 text-sm font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/messages/new"
            className="button-primary flex items-center gap-1.5"
          >
            <PlusCircle size={14} />
            New Message
          </Link>
          <Link
            href="/admin/messages/new?placement=HERO"
            className="button-tertiary flex items-center gap-1.5"
          >
            <Clapperboard size={14} />
            New Hero Media
          </Link>
          {isSuperAdmin ? (
            <Link
              href="/admin/admin-users"
              className="button-tertiary flex items-center gap-1.5"
            >
              <UserPlus size={14} />
              Admin Users
            </Link>
          ) : null}
          <Link
            href="/admin/health"
            className="button-tertiary flex items-center gap-1.5"
          >
            <Activity size={14} />
            Health
          </Link>
          <Link href="/admin/messages" className="button-tertiary">
            View All Messages
          </Link>
          <Link href="/admin/contacts" className="button-tertiary">
            View Contacts
          </Link>
          <Link
            href="/admin/books/new"
            className="button-primary flex items-center gap-1.5"
          >
            <PlusCircle size={14} />
            New Book
          </Link>
          <Link
            href="/admin/quotes/new"
            className="button-primary flex items-center gap-1.5"
          >
            <PlusCircle size={14} />
            New Quote
          </Link>
          <Link href="/admin/books" className="button-tertiary">
            View All Books
          </Link>
          <Link href="/admin/quotes" className="button-tertiary">
            View All Quotes
          </Link>
        </div>
      </div>
    </div>
  );
}
