"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  BookMarked,
  Quote,
  Mail,
  Activity,
  ScrollText,
  LogOut,
  X,
  Users,
  PanelLeftClose,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/books", label: "Books", icon: BookOpen },
  { href: "/admin/quotes", label: "Quotes", icon: Quote },
  { href: "/admin/contacts", label: "Contacts", icon: Mail },
  { href: "/admin/health", label: "Health", icon: Activity },
  { href: "/admin/guide", label: "Guide", icon: BookMarked },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
];

const SUPER_ADMIN_NAV = [
  { href: "/admin/admin-users", label: "Admin Users", icon: Users },
];

export default function AdminSidebar({
  userName,
  isSuperAdmin,
  mobileOpen,
  onMobileOpenChange,
  desktopCollapsed,
  onDesktopToggle,
}: {
  userName: string;
  isSuperAdmin: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  desktopCollapsed: boolean;
  onDesktopToggle: () => void;
}) {
  const pathname = usePathname();
  const navItems = isSuperAdmin ? [...NAV, ...SUPER_ADMIN_NAV] : NAV;

  function classNames(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
  }

  function NavLinks() {
    return (
      <>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onMobileOpenChange(false)}
              className={classNames(
                "flex min-h-10 items-center rounded text-sm font-medium transition-colors",
                "gap-2.5 px-3 py-2",
                active
                  ? "bg-white/20 text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => onMobileOpenChange(false)}
          />
          <aside
            className="absolute left-0 top-0 flex h-full w-[min(18rem,84vw)] flex-col px-3 py-4"
            style={{ background: "var(--brand-primary-deep)" }}
          >
            <div className="mb-4 flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-white">SAVEMI Admin</p>
              <button
                onClick={() => onMobileOpenChange(false)}
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
      {desktopCollapsed ? null : (
        <aside
          className="fixed inset-y-0 left-0 z-40 hidden h-screen w-64 flex-col border-r px-4 py-5 lg:flex"
          style={{
            background: "var(--brand-primary-deep)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <div className="mb-5 flex items-center justify-between px-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                SAVEMI
              </p>
              <p className="truncate text-sm font-semibold text-white">
                Admin Office
              </p>
            </div>
            <button
              type="button"
              onClick={onDesktopToggle}
              className="inline-flex h-9 w-9 items-center justify-center rounded text-white/65 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close admin navigation"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-0.5">
              <NavLinks />
            </div>
          </nav>

          <div className="mt-5">
            <p className="truncate px-3 text-xs text-white/40">{userName}</p>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="mt-2 flex min-h-10 w-full items-center gap-2.5 rounded px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
