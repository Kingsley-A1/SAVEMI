"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import dynamic from "next/dynamic";

const WelcomeAnimation = dynamic(() => import("./WelcomeAnimation"), {
  ssr: false,
});

const WELCOME_STORAGE_KEY = "savemi-welcome-seen-at";
const WELCOME_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export default function HomeAnimationWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    try {
      const lastSeen = Number(window.localStorage.getItem(WELCOME_STORAGE_KEY));
      setShowAnimation(!lastSeen || Date.now() - lastSeen > WELCOME_COOLDOWN_MS);
    } catch {
      setShowAnimation(true);
    } finally {
      setReady(true);
    }
  }, []);

  const handleAnimDone = useCallback(() => {
    try {
      window.localStorage.setItem(WELCOME_STORAGE_KEY, String(Date.now()));
    } catch {
      // localStorage may be unavailable in private or restricted browsers.
    }
    setShowAnimation(false);
  }, []);

  const contentVisible = ready && !showAnimation;

  return (
    <>
      {ready && showAnimation && <WelcomeAnimation onDone={handleAnimDone} />}

      <div
        className={`space-y-16 transition-opacity duration-500 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {children}
      </div>
    </>
  );
}
