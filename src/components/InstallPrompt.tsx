"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Share, X } from "lucide-react";

const DISMISS_KEY = "savemi-install-dismissed-at";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000; // re-offer after 14 days

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function wasRecentlyDismissed(): boolean {
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < SNOOZE_MS;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<"native" | "ios">("native");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installation still works without a service worker; ignore.
      });
    }
  }, []);

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return;

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVariant("native");
      const timer = setTimeout(() => setVisible(true), 1800);
      return () => clearTimeout(timer);
    }

    function handleAppInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // iOS Safari never fires beforeinstallprompt — offer manual instructions.
    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIOS) {
      iosTimer = setTimeout(() => {
        setVariant("ios");
        setVisible(true);
      }, 1800);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 sm:px-4 sm:pb-4"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      role="dialog"
      aria-label="Install SAVEMI"
    >
      <div
        className="relative flex w-full max-w-sm items-start gap-3 rounded-xl p-4 shadow-lg sm:max-w-md"
        style={{
          background: "var(--brand-surface-strong)",
          border: "1px solid var(--brand-border)",
          boxShadow: "0 12px 32px rgba(6,55,39,0.18)",
        }}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-brand-muted transition-colors hover:bg-black/5"
        >
          <X size={14} />
        </button>

        <Image
          src="/images/logo.jpg"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-lg object-cover"
        />

        <div className="min-w-0 pr-4">
          <p className="text-sm font-semibold">Install SAVEMI</p>
          <p className="text-brand-muted mt-0.5 text-xs leading-5">
            {variant === "native"
              ? "Add SAVEMI to your home screen for quick, distraction-free access to Sabbath reflections."
              : "Tap the Share icon, then “Add to Home Screen” for quick access to Sabbath reflections."}
          </p>

          <div className="mt-3 flex items-center gap-2">
            {variant === "native" ? (
              <button
                type="button"
                onClick={handleInstall}
                disabled={installing}
                className="button-primary inline-flex items-center gap-1.5 !px-3 !py-1.5 text-xs"
              >
                <Download size={13} />
                {installing ? "Installing…" : "Install"}
              </button>
            ) : (
              <span className="button-primary pointer-events-none inline-flex items-center gap-1.5 !px-3 !py-1.5 text-xs opacity-90">
                <Share size={13} />
                Share &rarr; Add to Home Screen
              </span>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="button-tertiary !px-3 !py-1.5 text-xs"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
