"use client";

import { useState, useCallback, ReactNode } from "react";
import dynamic from "next/dynamic";

const WelcomeAnimation = dynamic(() => import("./WelcomeAnimation"), {
  ssr: false,
});

export default function HomeAnimationWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const [animDone, setAnimDone] = useState(false);
  const handleAnimDone = useCallback(() => setAnimDone(true), []);

  return (
    <>
      {!animDone && <WelcomeAnimation onDone={handleAnimDone} />}

      <div
        className={`space-y-16 transition-opacity duration-500 ${
          animDone ? "opacity-100" : "opacity-0"
        }`}
      >
        {children}
      </div>
    </>
  );
}
