"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Sends one page-view beacon per public route change. */
export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    sendTrack({ type: "view", path: pathname });
  }, [pathname]);

  return null;
}

export function sendTrack(payload: Record<string, unknown>) {
  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics never interrupts the reader.
  }
}
