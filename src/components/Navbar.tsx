"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/messages", label: "Messages" },
  { href: "/audio", label: "Audio" },
  { href: "/books", label: "Books" },
  { href: "/quotes", label: "Quotes" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-sm"
      style={{
        background: "var(--brand-surface-strong)",
        borderBottom: "1px solid var(--brand-border)",
      }}
    >
      <div className="site-container">
        <nav
          className="flex h-14 items-center justify-between"
          aria-label="Primary navigation"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
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
          <ul className="hidden items-center gap-0.5 sm:flex">
            {navigation.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
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

          {/* Mobile hamburger */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded sm:hidden"
            style={{ color: "var(--brand-primary)" }}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          id="mobile-nav"
          className="border-t sm:hidden"
          style={{
            background: "var(--brand-surface-strong)",
            borderColor: "var(--brand-border)",
          }}
        >
          <ul className="site-container flex flex-col py-2">
            {navigation.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "text-brand-primary font-semibold"
                        : "text-brand-muted hover:text-brand-primary"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
