"use client";

import { useEffect, useRef, useState } from "react";

const TAGLINE = ["Repose.", "Renewal.", "Restoration."];
const SAVEMI_CHARS = "SAVEMI".split("");

type Phase =
  | "welcome" // "Welcome to"
  | "typing" // typing SAVEMI
  | "tagline" // tagline words appear
  | "underline" // green line draws
  | "dismiss"; // whole overlay fades out

export default function WelcomeAnimation({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [typedCount, setTypedCount] = useState(0);
  const [shownWords, setShownWords] = useState(0);
  const [underlineWidth, setUnderlineWidth] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const taglineRef = useRef<HTMLParagraphElement>(null);

  // welcome → typing after 600ms
  useEffect(() => {
    const t = setTimeout(() => setPhase("typing"), 600);
    return () => clearTimeout(t);
  }, []);

  // typing SAVEMI one char per 95ms
  useEffect(() => {
    if (phase !== "typing") return;
    if (typedCount < SAVEMI_CHARS.length) {
      const t = setTimeout(() => setTypedCount((c) => c + 1), 95);
      return () => clearTimeout(t);
    }
    // all chars typed → move to tagline after short pause
    const t = setTimeout(() => setPhase("tagline"), 400);
    return () => clearTimeout(t);
  }, [phase, typedCount]);

  // tagline words appear one per 340ms
  useEffect(() => {
    if (phase !== "tagline") return;
    if (shownWords < TAGLINE.length) {
      const t = setTimeout(() => setShownWords((n) => n + 1), 340);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPhase("underline"), 200);
    return () => clearTimeout(t);
  }, [phase, shownWords]);

  // underline draws from 0 → 100% in 500ms
  useEffect(() => {
    if (phase !== "underline") return;
    const start = performance.now();
    const duration = 500;
    let raf: number;
    function step(now: number) {
      const pct = Math.min((now - start) / duration, 1);
      setUnderlineWidth(pct * 100);
      if (pct < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setTimeout(() => setPhase("dismiss"), 600);
      }
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // dismiss: fade out, then call onDone
  useEffect(() => {
    if (phase !== "dismiss") return;
    const start = performance.now();
    const duration = 500;
    let raf: number;
    function step(now: number) {
      const pct = Math.min((now - start) / duration, 1);
      setOpacity(1 - pct);
      if (pct < 1) {
        raf = requestAnimationFrame(step);
      } else {
        onDone();
      }
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: "var(--brand-primary-deep)",
        opacity,
        pointerEvents: phase === "dismiss" ? "none" : "auto",
      }}
    >
      {/* "Welcome to" */}
      <p
        className="text-sm font-medium uppercase tracking-[0.25em] transition-opacity duration-300"
        style={{
          color: "rgba(241,231,201,0.65)",
          opacity:
            phase === "welcome" ||
            phase === "typing" ||
            phase === "tagline" ||
            phase === "underline"
              ? 1
              : 0,
        }}
      >
        Welcome to
      </p>

      {/* SAVEMI typing */}
      <h1
        className="mt-2 font-semibold tracking-tight"
        style={{
          fontSize: "clamp(3rem, 10vw, 6rem)",
          color: "#4ade80",
          minHeight: "1.1em",
        }}
        aria-live="polite"
      >
        {SAVEMI_CHARS.slice(0, typedCount).join("")}
        {typedCount < SAVEMI_CHARS.length && phase === "typing" ? (
          <span
            className="ml-0.5 inline-block"
            style={{
              width: "0.06em",
              height: "0.9em",
              background: "#4ade80",
              verticalAlign: "middle",
              animation: "blink 0.7s step-end infinite",
            }}
          />
        ) : null}
      </h1>

      {/* Tagline words */}
      <p
        ref={taglineRef}
        className="mt-3 flex gap-3 text-lg font-light tracking-wide sm:text-xl"
        style={{ color: "rgba(241,231,201,0.8)" }}
      >
        {TAGLINE.map((word, i) => (
          <span
            key={word}
            style={{
              opacity: i < shownWords ? 1 : 0,
              transform: i < shownWords ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 0.35s ease, transform 0.35s ease",
            }}
          >
            {word}
          </span>
        ))}
      </p>

      {/* Drawing underline */}
      <div
        className="mt-3 h-px overflow-hidden"
        style={{ width: taglineRef.current?.offsetWidth ?? 240 }}
      >
        <div
          style={{
            height: "1px",
            width: `${underlineWidth}%`,
            background: "#4ade80",
            transition: "none",
          }}
        />
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
