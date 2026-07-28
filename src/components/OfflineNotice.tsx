"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Live connection notice.
 *
 * Shows a banner the moment the browser goes offline, and a brief
 * "back online" confirmation when the connection returns. This complements
 * the /offline fallback page (served by the service worker when a navigation
 * fails) by telling people what happened while they are still on the page.
 */
export default function OfflineNotice() {
  const [offline, setOffline] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    // navigator.onLine is only meaningful after mount (SSR has no navigator).
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOffline(true);
    }

    let restoredTimer: ReturnType<typeof setTimeout> | undefined;

    function handleOffline() {
      setRestored(false);
      setOffline(true);
    }

    function handleOnline() {
      setOffline(false);
      setRestored(true);
      restoredTimer = setTimeout(() => setRestored(false), 4000);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (restoredTimer) clearTimeout(restoredTimer);
    };
  }, []);

  if (!offline && !restored) return null;

  const isOffline = offline;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pt-3"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      role="status"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-medium shadow-lg"
        style={
          isOffline
            ? {
                background: "var(--brand-primary-deep)",
                color: "#fff8ea",
                boxShadow: "0 8px 24px rgba(6,55,39,0.28)",
              }
            : {
                background: "#15803d",
                color: "#ffffff",
                boxShadow: "0 8px 24px rgba(21,128,61,0.28)",
              }
        }
      >
        {isOffline ? (
          <>
            <WifiOff size={14} aria-hidden="true" />
            You&apos;re offline — some content may be unavailable.
          </>
        ) : (
          <>
            <Wifi size={14} aria-hidden="true" />
            Back online.
          </>
        )}
      </div>
    </div>
  );
}
