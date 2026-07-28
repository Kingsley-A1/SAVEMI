"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Film,
  Headphones,
  Home,
  Image as ImageIcon,
  Info,
  Mail,
  LogIn,
  Quote,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import SocialLinks from "./SocialLinks";
import type { SocialLink } from "../lib/social";

interface SidebarLink {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface SidebarSection {
  title: string;
  links: readonly SidebarLink[];
}

/**
 * Grouped so the drawer reads as a map of the ministry rather than a flat
 * list — each entry carries a short description for clarity and for anyone
 * navigating by screen reader.
 */
const SECTIONS: readonly SidebarSection[] = [
  {
    title: "Ministry",
    links: [
      { href: "/", label: "Home", description: "Sabbath reflection", icon: Home },
      { href: "/about", label: "About", description: "Our story and mission", icon: Info },
      { href: "/team", label: "Team", description: "The people who serve", icon: Users },
      { href: "/contact", label: "Contact", description: "Reach the ministry", icon: Mail },
    ],
  },
  {
    title: "Library",
    links: [
      { href: "/videos", label: "Videos", description: "Sabbath teachings", icon: Film },
      { href: "/audio", label: "Audio", description: "Quiet listening", icon: Headphones },
      { href: "/images", label: "Images", description: "Visual reflections", icon: ImageIcon },
      { href: "/books", label: "Books", description: "Downloads and resources", icon: BookOpen },
      { href: "/quotes", label: "Quotes", description: "Short encouragements", icon: Quote },
    ],
  },
];

/** Kept apart from public browsing: this is the staff door, and it is guarded. */
const ADMIN_LINK: SidebarLink = {
  href: "/admin",
  label: "Admin Portal",
  description: "Sign-in required",
  icon: ShieldCheck,
};

const ACCOUNT_LINK: SidebarLink = {
  href: "/account",
  label: "My Account",
  description: "Your profile and password",
  icon: UserRound,
};

const JOIN_LINKS: readonly SidebarLink[] = [
  {
    href: "/login",
    label: "Sign In",
    description: "Welcome back",
    icon: LogIn,
  },
  {
    href: "/register",
    label: "Create Account",
    description: "Join the SAVEMI family",
    icon: UserRound,
  },
];

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function PublicSidebar({
  open,
  onClose,
  socialLinks,
  signedIn = false,
}: {
  open: boolean;
  onClose: () => void;
  socialLinks?: SocialLink[];
  /** Show the member's own door instead of the join links. */
  signedIn?: boolean;
}) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
    [pathname],
  );

  // Lock the page behind the drawer, park focus inside it, and give it back
  // to the trigger on close.
  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
        style={{ background: "rgba(2,20,15,0.5)", backdropFilter: "blur(2px)" }}
        tabIndex={-1}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className="public-sidebar absolute inset-y-0 left-0"
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-4"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          <Link
            href="/"
            onClick={onClose}
            className="flex min-w-0 items-center gap-3 rounded"
          >
            <Image
              src="/images/logo.jpg"
              alt=""
              width={36}
              height={36}
              className="shrink-0 rounded-lg object-contain"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">SAVEMI</span>
              <span
                className="block truncate text-[0.68rem] font-medium uppercase tracking-[0.14em]"
                style={{ color: "rgba(190,242,214,0.7)" }}
              >
                Sabbath Vesper Ministry
              </span>
            </span>
          </Link>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "rgba(234,250,241,0.8)" }}
          >
            <X size={19} />
          </button>
        </div>

        <nav
          className="min-h-0 flex-1 overflow-y-auto px-2 py-3"
          aria-label="Site sections"
        >
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="public-sidebar__section">{section.title}</h2>
              <ul>
                {section.links.map(({ href, label, description, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      aria-current={isActive(href) ? "page" : undefined}
                      className="public-sidebar__link"
                    >
                      <Icon size={17} className="shrink-0" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate">{label}</span>
                        <span
                          className="block truncate text-[0.7rem] font-normal"
                          style={{ color: "rgba(190,242,214,0.55)" }}
                        >
                          {description}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <h2 className="public-sidebar__section">Your Account</h2>
          <ul>
            {(signedIn ? [ACCOUNT_LINK] : JOIN_LINKS).map(
              ({ href, label, description, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    aria-current={isActive(href) ? "page" : undefined}
                    className="public-sidebar__link"
                  >
                    <Icon size={17} className="shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate">{label}</span>
                      <span
                        className="block truncate text-[0.7rem] font-normal"
                        style={{ color: "rgba(190,242,214,0.55)" }}
                      >
                        {description}
                      </span>
                    </span>
                  </Link>
                </li>
              ),
            )}
          </ul>

          <h2 className="public-sidebar__section">Ministry Office</h2>
          <ul>
            <li>
              <Link
                href={ADMIN_LINK.href}
                onClick={onClose}
                aria-current={isActive(ADMIN_LINK.href) ? "page" : undefined}
                className="public-sidebar__link"
              >
                <ADMIN_LINK.icon size={17} className="shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block truncate">{ADMIN_LINK.label}</span>
                  <span
                    className="block truncate text-[0.7rem] font-normal"
                    style={{ color: "rgba(190,242,214,0.55)" }}
                  >
                    {ADMIN_LINK.description}
                  </span>
                </span>
              </Link>
            </li>
          </ul>
        </nav>

        <div
          className="border-t px-4 py-4"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          <p
            className="text-[0.7rem] italic leading-5"
            style={{ color: "rgba(234,250,241,0.66)" }}
          >
            &ldquo;He maketh me to lie down in green pastures.&rdquo;
          </p>
          <p
            className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "rgba(190,242,214,0.6)" }}
          >
            Psalm 23:2
          </p>
          <div className="mt-3">
            <SocialLinks
              links={socialLinks}
              variant="icons"
              mono
              className="public-sidebar__social"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
