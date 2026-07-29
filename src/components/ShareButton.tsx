"use client";

/**
 * Share a page to wherever the visitor already talks to people.
 *
 * On a phone this opens the operating system's own share sheet, which is the
 * one place WhatsApp, Messages, and everything else the visitor uses already
 * live. Where that isn't available — most desktop browsers — it falls back to
 * an explicit menu of the destinations the ministry actually reaches, plus a
 * copy-link that confirms itself.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Share2, X } from "lucide-react";
import { FacebookIcon, WhatsAppIcon, XIcon } from "./SocialIcons";

/** Menu box, in pixels — used to keep it on screen before it renders. */
const MENU_WIDTH = 224;
const MENU_HEIGHT = 210;

interface ShareButtonProps {
  /** Site-relative path, e.g. "/messages/walking-in-the-light". */
  path: string;
  title: string;
  /** One line of context included in the shared text. */
  summary?: string;
  className?: string;
  label?: string;
}

export default function ShareButton({
  path,
  title,
  summary,
  className = "button-tertiary",
  label = "Share",
}: ShareButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The menu is positioned fixed, measured from the button. Absolute
  // positioning would be clipped by the media cards, which hide overflow to
  // crop their cover art, and could also run off the edge of narrow screens.
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );

  const placeMenu = useCallback(() => {
    const button = containerRef.current?.querySelector("button");
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const margin = 8;
    const left = Math.min(
      Math.max(margin, rect.left),
      Math.max(margin, window.innerWidth - MENU_WIDTH - margin),
    );

    // Flip above the button when there isn't room beneath it.
    const opensUpward =
      rect.bottom + MENU_HEIGHT + margin > window.innerHeight &&
      rect.top > MENU_HEIGHT + margin;

    setMenuPos({
      top: opensUpward ? rect.top - MENU_HEIGHT - margin : rect.bottom + margin,
      left,
    });
  }, []);

  // Resolved in the browser so the link is correct on any deployment —
  // production, preview, or localhost.
  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => {
    setShareUrl(new URL(path, window.location.origin).toString());
  }, [path]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  // Dismiss the fallback menu on outside click or Escape, and keep it pinned
  // to the button while the page moves under it.
  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [menuOpen, placeMenu]);

  const shareText = summary ? `${title} — ${summary}` : title;

  const handleClick = useCallback(async () => {
    if (!shareUrl) return;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      } catch {
        // The visitor dismissed the sheet, or the browser refused it.
        // Fall through to the menu rather than leaving the click dead.
      }
    }

    placeMenu();
    setMenuOpen((open) => !open);
  }, [shareUrl, title, shareText, placeMenu]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard access can be refused; leave the menu open so the visitor
      // can still select the address from the destination links.
    }
  }

  const encodedUrl = encodeURIComponent(shareUrl);
  const destinations = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      Icon: WhatsAppIcon,
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    },
    {
      key: "x",
      label: "X",
      Icon: XIcon,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodedUrl}`,
    },
    {
      key: "facebook",
      label: "Facebook",
      Icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
  ];

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        className={`${className} inline-flex items-center gap-1.5`}
        aria-label={`Share ${title}`}
        aria-haspopup={menuOpen ? "menu" : undefined}
        aria-expanded={menuOpen || undefined}
      >
        <Share2 size={14} aria-hidden="true" />
        {label}
      </button>

      {menuOpen && menuPos ? (
        <div
          role="menu"
          aria-label={`Share ${title}`}
          className="fixed z-50 overflow-hidden rounded-lg border bg-white p-1.5 shadow-lg"
          style={{
            borderColor: "var(--brand-border)",
            top: menuPos.top,
            left: menuPos.left,
            width: MENU_WIDTH,
          }}
        >
          <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
            <span
              className="text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--brand-text-soft)" }}
            >
              Share to
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close share menu"
              className="text-brand-muted hover:text-brand-primary"
            >
              <X size={14} />
            </button>
          </div>

          {destinations.map(({ key, label: name, Icon, href }) => (
            <a
              key={key}
              role="menuitem"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-[rgba(10,79,60,0.06)] focus:bg-[rgba(10,79,60,0.06)] focus:outline-none"
            >
              <Icon size={17} title={name} />
              {name}
            </a>
          ))}

          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-[rgba(10,79,60,0.06)] focus:bg-[rgba(10,79,60,0.06)] focus:outline-none"
          >
            {copied ? (
              <Check size={17} style={{ color: "#15803d" }} aria-hidden="true" />
            ) : (
              <Copy size={17} aria-hidden="true" />
            )}
            <span style={copied ? { color: "#15803d" } : undefined}>
              {copied ? "Link copied" : "Copy link"}
            </span>
          </button>
        </div>
      ) : null}

      {/* Copy confirmation is announced, not just coloured. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}
