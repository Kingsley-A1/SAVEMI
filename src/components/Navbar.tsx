"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, UserRound } from "lucide-react";
import PublicSidebar from "./PublicSidebar";
import type { SocialLink } from "../lib/social";

export interface NavAccount {
  name: string;
  isAdmin: boolean;
}

const navigation = [
  { href: "/", label: "Home" },
  { href: "/videos", label: "Videos" },
  { href: "/audio", label: "Audio" },
  { href: "/images", label: "Images" },
  { href: "/books", label: "Books" },
  { href: "/quotes", label: "Quotes" },
  { href: "/about", label: "About" },
  { href: "/team", label: "Team" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar({
  socialLinks,
  account,
}: {
  socialLinks?: SocialLink[];
  account?: NavAccount | null;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-30 backdrop-blur-sm"
        style={{
          background: "var(--brand-surface-strong)",
          borderBottom: "1px solid var(--brand-border)",
        }}
      >
        <div className="site-container">
          <nav
            className="flex h-14 items-center justify-between gap-3"
            aria-label="Primary navigation"
          >
            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <Image
                src="/images/logo.jpg"
                alt="SAVEMI logo"
                width={30}
                height={30}
                className="rounded object-contain"
              />
              <span className="text-brand-primary text-sm font-semibold tracking-tight">
                SAVEMI
              </span>
            </Link>

            {/* Desktop links */}
            <ul className="hidden items-center gap-0.5 md:flex">
              {navigation.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`rounded px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? "text-brand-primary font-medium"
                          : "text-brand-muted hover:text-brand-primary"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex shrink-0 items-center gap-2">
              {/* Signed in: their own door. Signed out: an invitation to join. */}
              {account ? (
                <Link
                  href={account.isAdmin ? "/admin" : "/account"}
                  className="hidden max-w-48 items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white lg:inline-flex"
                  style={{
                    borderColor: "var(--brand-border)",
                    color: "var(--brand-primary)",
                  }}
                >
                  {account.isAdmin ? (
                    <ShieldCheck size={14} aria-hidden="true" />
                  ) : (
                    <UserRound size={14} aria-hidden="true" />
                  )}
                  <span className="truncate">
                    {account.isAdmin ? "Admin" : account.name}
                  </span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-brand-muted hover:text-brand-primary hidden rounded px-3 py-1.5 text-xs font-semibold transition-colors lg:inline-flex"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="hidden items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white lg:inline-flex"
                    style={{
                      borderColor: "var(--brand-border)",
                      color: "var(--brand-primary)",
                    }}
                  >
                    <UserRound size={14} aria-hidden="true" />
                    Join
                  </Link>
                </>
              )}

              {/* Sidebar trigger — available at every width, not just mobile. */}
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded border px-3 text-sm font-medium transition-colors hover:bg-white"
                style={{
                  borderColor: "var(--brand-border)",
                  color: "var(--brand-primary)",
                }}
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={sidebarOpen}
                aria-haspopup="dialog"
              >
                <Menu size={18} aria-hidden="true" />
                <span className="hidden sm:inline">Menu</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <PublicSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        socialLinks={socialLinks}
        signedIn={Boolean(account)}
      />
    </>
  );
}
