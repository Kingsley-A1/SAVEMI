"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin progress bar across the top of the window during page navigation.
 *
 * Server components stream, so a click can sit for a beat before the next
 * screen paints. This gives that beat a visible heartbeat: the bar starts on
 * an in-app link click and completes when the URL settles.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  // Start on any click that will navigate within the app.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || anchor.hasAttribute("download") || anchor.target === "_blank") {
        return;
      }

      let destination: URL;
      try {
        destination = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      const sameDocument =
        destination.origin === window.location.origin &&
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search;

      if (destination.origin !== window.location.origin || sameDocument) return;

      setActive(true);
      setProgress(12);
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // Creep forward while pending so the bar never looks stuck.
  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      setProgress((current) => (current >= 90 ? current : current + (90 - current) * 0.16));
    }, 220);

    return () => clearInterval(interval);
  }, [active]);

  // The URL changed: finish, then fade out.
  useEffect(() => {
    if (!active) return;

    clearTimers();
    setProgress(100);
    timers.current.push(
      setTimeout(() => {
        setActive(false);
        setProgress(0);
      }, 320),
    );

    return clearTimers;
    // Completion is keyed on the resolved route, not on `active`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
      role="progressbar"
      aria-label="Loading page"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div
        className="h-full origin-left transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
          background:
            "linear-gradient(90deg, var(--brand-primary) 0%, #34d399 60%, var(--brand-accent) 100%)",
          boxShadow: "0 0 10px rgba(52,211,153,0.55)",
        }}
      />
    </div>
  );
}
