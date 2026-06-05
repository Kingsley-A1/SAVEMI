"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen, ShieldCheck } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

interface AdminShellProps {
  children: ReactNode;
  userName: string;
  userEmail: string;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
}

const PAGE_TITLES: Record<string, { title: string; eyebrow: string }> = {
  "/admin": {
    title: "Dashboard",
    eyebrow: "Ministry operations overview",
  },
  "/admin/messages": {
    title: "Messages",
    eyebrow: "Manage sermons, reflections, and media",
  },
  "/admin/books": {
    title: "Books",
    eyebrow: "Manage resources and author content",
  },
  "/admin/quotes": {
    title: "Quotes",
    eyebrow: "Manage reflections and quote images",
  },
  "/admin/contacts": {
    title: "Contacts",
    eyebrow: "Read visitor submissions",
  },
  "/admin/health": {
    title: "Platform Health",
    eyebrow: "Database health, content analytics, and launch checks",
  },
  "/admin/audit-log": {
    title: "Audit Log",
    eyebrow: "Recent admin write activity",
  },
  "/admin/admin-users": {
    title: "Admin Users",
    eyebrow: "Super admin account management",
  },
  "/admin/guide": {
    title: "Owner Guide",
    eyebrow: "Zero to Hero operating handbook",
  },
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  const matchedPath = Object.keys(PAGE_TITLES)
    .filter((path) => path !== "/admin" && pathname.startsWith(path))
    .sort((a, b) => b.length - a.length)[0];

  return matchedPath
    ? PAGE_TITLES[matchedPath]
    : { title: "Admin", eyebrow: "SAVEMI operations" };
}

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim() || "SAVEMI Admin";
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

export default function AdminShell({
  children,
  userName,
  userEmail,
  isAuthenticated,
  isSuperAdmin,
}: AdminShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const isLoginPage = pathname === "/admin/login";
  const isRegisterPage = pathname === "/admin/register";
  const showStandaloneAuthPage =
    isLoginPage || (!isAuthenticated && isRegisterPage);
  const pageTitle = getPageTitle(pathname);
  const roleLabel = isSuperAdmin ? "Super Admin" : "Admin";
  const initials = getInitials(userName, userEmail);

  useEffect(() => {
    const stored = window.localStorage.getItem("savemi-admin-sidebar");
    if (stored === "collapsed") setDesktopCollapsed(true);
  }, []);

  function handleDesktopSidebarToggle() {
    setDesktopCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(
        "savemi-admin-sidebar",
        next ? "collapsed" : "expanded",
      );
      return next;
    });
  }

  if (showStandaloneAuthPage) {
    return <div className="min-h-screen bg-[#f6f2e8]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#f3efe4]">
      <AdminSidebar
        userName={userName}
        isSuperAdmin={isSuperAdmin}
        mobileOpen={mobileNavOpen}
        onMobileOpenChange={setMobileNavOpen}
        desktopCollapsed={desktopCollapsed}
        onDesktopToggle={handleDesktopSidebarToggle}
      />

      <div
        className={classNames(
          "min-h-screen min-w-0 transition-[padding] duration-200",
          desktopCollapsed ? "lg:pl-0" : "lg:pl-64",
        )}
      >
        <header
          className="sticky top-0 z-30 border-b bg-[#fffdf7]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8"
          style={{ borderColor: "var(--brand-border)" }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded border text-[var(--brand-primary)] lg:hidden"
                style={{ borderColor: "var(--brand-border)" }}
                aria-label="Open admin navigation"
              >
                <Menu size={19} />
              </button>
              <button
                type="button"
                onClick={handleDesktopSidebarToggle}
                className="hidden h-10 w-10 items-center justify-center rounded border text-[var(--brand-primary)] transition-colors hover:bg-[rgba(10,79,60,0.06)] lg:inline-flex"
                style={{ borderColor: "var(--brand-border)" }}
                aria-label={
                  desktopCollapsed
                    ? "Expand admin navigation"
                    : "Collapse admin navigation"
                }
              >
                {desktopCollapsed ? (
                  <PanelLeftOpen size={18} />
                ) : (
                  <PanelLeftClose size={18} />
                )}
              </button>
              <div className="min-w-0">
                <p className="text-brand-muted truncate text-xs font-medium">
                  {pageTitle.eyebrow}
                </p>
                <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                  {pageTitle.title}
                </h1>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden items-center gap-2 rounded border bg-white px-3 py-2 text-xs text-brand-muted sm:flex">
                <ShieldCheck size={15} className="text-[var(--brand-primary)]" />
                <span>{roleLabel}</span>
              </div>
              <div className="flex min-w-0 items-center gap-3 rounded border bg-white px-2.5 py-2 shadow-sm sm:px-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={{
                    background: "rgba(10,79,60,0.1)",
                    color: "var(--brand-primary)",
                  }}
                  aria-hidden="true"
                >
                  {initials}
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-sm font-semibold">{userName}</p>
                  <p className="text-brand-muted truncate text-xs">
                    {userEmail || roleLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
          </div>
        </main>
      </div>
    </div>
  );
}
