/**
 * SAVEMI loading system.
 *
 * One place for every "something is happening" state so no action ever looks
 * dead: spinners, page loaders, button loaders, card/table/media skeletons,
 * and inline status text. Everything is theme-aware (brand tokens only),
 * respects `prefers-reduced-motion` via the shared `.savemi-shimmer` class in
 * globals.css, and announces itself to assistive tech.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────
   Spinner
   ──────────────────────────────────────────────────────────────────────── */

export type SpinnerSize = "xs" | "sm" | "md" | "lg";

const SPINNER_PX: Record<SpinnerSize, number> = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 28,
};

export function Spinner({
  size = "sm",
  className = "",
  tone = "primary",
  label,
}: {
  size?: SpinnerSize;
  className?: string;
  /** `primary` for light surfaces, `inverse` for dark/coloured surfaces. */
  tone?: "primary" | "inverse" | "muted";
  /** When set, the spinner is announced instead of hidden. */
  label?: string;
}) {
  const color =
    tone === "inverse"
      ? "currentColor"
      : tone === "muted"
        ? "var(--brand-text-soft)"
        : "var(--brand-primary)";

  return (
    <Loader2
      size={SPINNER_PX[size]}
      className={`animate-spin ${className}`}
      style={{ color }}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Page loader — route-level and section-level
   ──────────────────────────────────────────────────────────────────────── */

export function PageLoader({
  title = "Loading",
  description = "One moment while the page is prepared.",
  fullScreen = false,
}: {
  title?: string;
  description?: string;
  /** Fill the viewport (auth screens, first paint) instead of flowing inline. */
  fullScreen?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        fullScreen
          ? "flex min-h-screen w-full flex-col items-center justify-center gap-4 px-6"
          : "flex w-full flex-col items-center justify-center gap-4 px-6 py-20"
      }
    >
      <span className="savemi-loader-ring" aria-hidden="true">
        <Spinner size="lg" />
      </span>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>
          {title}
        </p>
        <p className="text-brand-muted mt-1 text-xs leading-5">{description}</p>
      </div>
    </div>
  );
}

/** Small inline loader for a panel or a slot inside a page. */
export function SectionLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 py-10"
    >
      <Spinner size="md" />
      <span className="text-brand-muted text-sm">{label}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Skeleton primitives
   ──────────────────────────────────────────────────────────────────────── */

export function Skeleton({
  className = "",
  rounded = "rounded",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`savemi-shimmer block ${rounded} ${className}`}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-3 ${index === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/** Wrapper that labels a block of skeletons for screen readers. */
export function SkeletonRegion({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Card skeletons
   ──────────────────────────────────────────────────────────────────────── */

/** Media card with cover — matches MessageCard / MessageTypeCard. */
export function MediaCardSkeleton() {
  return (
    <article className="site-panel flex h-full flex-col overflow-hidden">
      <Skeleton className="aspect-video w-full" rounded="rounded-none" />
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-4 w-4/5" />
        <SkeletonText lines={2} className="mt-3" />
        <div className="mt-auto flex items-center justify-between gap-2 pt-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </article>
  );
}

/** Portrait card — matches the books library. */
export function BookCardSkeleton() {
  return (
    <article className="site-panel flex h-full flex-col overflow-hidden p-4 sm:p-5">
      <Skeleton className="aspect-[3/4] w-full" rounded="rounded-lg" />
      <Skeleton className="mt-4 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <SkeletonText lines={2} className="mt-3" />
      <Skeleton className="mt-4 h-9 w-full" />
    </article>
  );
}

/** Text-only card — quotes, dashboard tiles, generic panels. */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <article className="site-panel p-4 sm:p-5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <SkeletonText lines={lines} className="mt-3" />
    </article>
  );
}

export function CardGridSkeleton({
  count = 6,
  variant = "media",
  className = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
  label = "Loading content",
}: {
  count?: number;
  variant?: "media" | "book" | "text";
  className?: string;
  label?: string;
}) {
  const Card =
    variant === "book"
      ? BookCardSkeleton
      : variant === "text"
        ? CardSkeleton
        : MediaCardSkeleton;

  return (
    <SkeletonRegion label={label}>
      <ul className={className}>
        {Array.from({ length: count }).map((_, index) => (
          <li key={index}>
            <Card />
          </li>
        ))}
      </ul>
    </SkeletonRegion>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Page-header / table / stat skeletons — admin screens
   ──────────────────────────────────────────────────────────────────────── */

export function PageHeaderSkeleton() {
  return (
    <div className="site-panel p-4 sm:p-6" aria-hidden="true">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-7 w-64 max-w-full" />
      <Skeleton className="mt-3 h-3 w-96 max-w-full" />
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  columns = 4,
  label = "Loading records",
}: {
  rows?: number;
  columns?: number;
  label?: string;
}) {
  return (
    <SkeletonRegion label={label} className="site-panel overflow-hidden">
      <div
        className="border-b px-4 py-3"
        style={{ borderColor: "var(--brand-border)" }}
      >
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="divide-y" style={{ borderColor: "var(--brand-border)" }}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid items-center gap-3 px-4 py-3.5"
            style={{
              gridTemplateColumns: `minmax(0,2fr) repeat(${Math.max(columns - 1, 1)}, minmax(0,1fr))`,
            }}
          >
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <Skeleton
                key={columnIndex}
                className={`h-3 ${columnIndex === 0 ? "w-4/5" : "w-2/3"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonRegion
      label="Loading statistics"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="site-panel p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-16" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <SkeletonRegion label="Loading form" className="space-y-5">
      <PageHeaderSkeleton />
      <div className="site-panel space-y-4 p-5">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-32" />
      </div>
    </SkeletonRegion>
  );
}

export function DetailSkeleton() {
  return (
    <SkeletonRegion label="Loading details" className="space-y-4">
      <div className="site-panel p-4 sm:p-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-4 h-8 w-3/4" />
        <SkeletonText lines={2} className="mt-4" />
      </div>
      <div className="site-panel p-4">
        <Skeleton className="aspect-video w-full" rounded="rounded-lg" />
      </div>
      <div className="site-panel p-4 sm:p-6">
        <SkeletonText lines={4} />
      </div>
    </SkeletonRegion>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Button loader
   ──────────────────────────────────────────────────────────────────────── */

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Swap the label for a spinner and block further clicks. */
  loading?: boolean;
  /** Label shown while loading. Defaults to the idle children. */
  loadingLabel?: string;
  /** Icon rendered before the label when idle. */
  icon?: ReactNode;
  /** Spinner tone — `inverse` on filled brand buttons. */
  spinnerTone?: "primary" | "inverse" | "muted";
  children: ReactNode;
}

/**
 * Button that can never be double-submitted and never looks dead: while
 * `loading` it shows a spinner, keeps its width, and reports `aria-busy`.
 */
export function LoadingButton({
  loading = false,
  loadingLabel,
  icon,
  spinnerTone = "inverse",
  children,
  className = "button-primary",
  disabled,
  type = "button",
  ...rest
}: LoadingButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${className} gap-1.5 disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {loading ? (
        <Spinner size="sm" tone={spinnerTone} />
      ) : icon ? (
        <span aria-hidden="true" className="inline-flex">
          {icon}
        </span>
      ) : null}
      <span>{loading ? (loadingLabel ?? children) : children}</span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Inline status
   ──────────────────────────────────────────────────────────────────────── */

/** Small "working…" line for optimistic areas (filters, saves, downloads). */
export function InlineLoader({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}
      style={{ color: "var(--brand-text-soft)" }}
    >
      <Spinner size="xs" />
      {label}
    </span>
  );
}

/** Blocking veil for a panel that is refreshing in place. */
export function OverlayLoader({ label = "Working…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-20 flex items-center justify-center gap-2 rounded-[inherit] backdrop-blur-[1px]"
      style={{ background: "rgba(255,253,247,0.72)" }}
    >
      <Spinner size="md" />
      <span className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>
        {label}
      </span>
    </div>
  );
}
