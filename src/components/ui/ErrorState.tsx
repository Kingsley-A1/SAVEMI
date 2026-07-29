"use client";

/**
 * The one place a failure is explained to a person.
 *
 * Every `error.tsx` boundary renders this, so a crash anywhere in the site
 * reads as a calm SAVEMI page — what happened, what to do next, and a way
 * back — instead of the host's generic error screen.
 */

import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export interface ErrorStateProps {
  /** Short, plain-language statement of what failed. */
  title?: string;
  /** One or two sentences on what the visitor can do. */
  description?: string;
  /** Re-runs the failed render. Wired to the boundary's `reset`. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Where "go back" leads. */
  homeHref?: string;
  homeLabel?: string;
  /**
   * Next's error digest. Shown quietly so someone reporting the problem can
   * quote it — the message itself is never surfaced, as it can leak internals.
   */
  digest?: string;
  /** `page` fills the viewport; `panel` sits inside an existing layout. */
  variant?: "page" | "panel";
}

export default function ErrorState({
  title = "Something went wrong",
  description = "The page could not be loaded. This is on our side, not yours — try again, and if it keeps happening let the ministry know.",
  onRetry,
  retryLabel = "Try again",
  homeHref = "/",
  homeLabel = "Go to home",
  digest,
  variant = "page",
}: ErrorStateProps) {
  return (
    <section
      role="alert"
      className={
        variant === "page"
          ? "flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center"
          : "site-panel flex flex-col items-center px-6 py-12 text-center"
      }
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "rgba(180,83,9,0.1)" }}
      >
        <AlertTriangle size={24} style={{ color: "#b45309" }} aria-hidden="true" />
      </span>

      <h1 className="section-title mt-5 text-xl sm:text-2xl">{title}</h1>
      <p className="section-copy mx-auto mt-3 max-w-md">{description}</p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="button-primary inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} aria-hidden="true" />
            {retryLabel}
          </button>
        ) : null}
        <Link
          href={homeHref}
          className="button-tertiary inline-flex items-center gap-1.5"
        >
          <Home size={14} aria-hidden="true" />
          {homeLabel}
        </Link>
      </div>

      {digest ? (
        <p className="text-brand-muted mt-6 text-xs">
          Reference code:{" "}
          <code className="font-mono font-semibold">{digest}</code>
        </p>
      ) : null}
    </section>
  );
}
