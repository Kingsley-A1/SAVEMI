"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Quote,
  Mail,
  ScrollText,
  LogOut,
  Menu,
  X,
  UserPlus,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/books", label: "Books", icon: BookOpen },
  { href: "/admin/quotes", label: "Quotes", icon: Quote },
  { href: "/admin/contacts", label: "Contacts", icon: Mail },
  { href: "/admin/register", label: "Register Admin", icon: UserPlus },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
];

export default function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function NavLinks() {
    return (
      <>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 lg:hidden"
        style={{
          background: "var(--brand-primary-deep)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="text-white"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-white">SAVEMI Admin</span>
        </div>
        <span className="text-xs text-white/55">{userName}</span>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 flex h-full w-[min(18rem,84vw)] flex-col px-3 py-4"
            style={{ background: "var(--brand-primary-deep)" }}
          >
            <div className="mb-4 flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-white">SAVEMI Admin</p>
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-col gap-0.5">
              <NavLinks />
            </nav>
            <div className="mt-auto">
              <p className="px-3 text-xs text-white/40">{userName}</p>
              <button
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="mt-2 flex w-full items-center gap-2.5 rounded px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden w-64 shrink-0 flex-col border-r px-4 py-6 lg:flex"
        style={{
          background: "var(--brand-primary-deep)",
          minHeight: "100vh",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <p className="mb-5 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
          SAVEMI Admin
        </p>
        <nav className="flex flex-col gap-0.5">
          <NavLinks />
        </nav>
        <div className="mt-auto">
          <p className="px-3 text-xs text-white/40">{userName}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="mt-2 flex w-full items-center gap-2.5 rounded px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
