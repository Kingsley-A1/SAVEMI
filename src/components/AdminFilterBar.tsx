"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useCallback } from "react";
import { Search, X } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface AdminFilterBarProps {
  /** The current search query value (controlled externally via URL). */
  search?: string;
  /** Optional dropdown filters. Each entry renders a <select>. */
  filters?: Array<{
    name: string;
    placeholder: string;
    value: string;
    options: FilterOption[];
  }>;
  /** Placeholder for the text search input. */
  searchPlaceholder?: string;
  /** CSV export URL — when provided, a Download CSV button is shown. */
  exportUrl?: string;
}

export default function AdminFilterBar({
  search = "",
  filters = [],
  searchPlaceholder = "Search…",
  exportUrl,
}: AdminFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const applyParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Always reset to page 1 when filters change.
      params.delete("cursor");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname);
    });
  }, [router, pathname]);

  const hasFilters =
    search ||
    filters.some((f) => searchParams.get(f.name));

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3"
      style={{ borderColor: "var(--border-subtle)", background: "var(--surface-elevated)" }}
    >
      {/* Text search */}
      <div className="relative flex min-w-[180px] flex-1 items-center">
        <Search
          size={14}
          className="pointer-events-none absolute left-3"
          style={{ color: "var(--fg-muted)" }}
        />
        <input
          type="search"
          defaultValue={search}
          placeholder={searchPlaceholder}
          aria-label="Search"
          className="w-full rounded-lg border py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface-base)",
            color: "var(--fg-primary)",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              applyParam("search", (e.target as HTMLInputElement).value.trim());
            }
          }}
          onChange={(e) => {
            // Debounce-free: apply on Enter (above) or on clear
            if (!e.target.value) applyParam("search", "");
          }}
        />
      </div>

      {/* Dynamic dropdown filters */}
      {filters.map((filter) => (
        <select
          key={filter.name}
          aria-label={filter.placeholder}
          defaultValue={filter.value}
          className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface-base)",
            color: "var(--fg-primary)",
          }}
          onChange={(e) => applyParam(filter.name, e.target.value)}
        >
          <option value="">{filter.placeholder}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {/* Loading indicator */}
      {isPending && (
        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
          Filtering…
        </span>
      )}

      {/* Clear all */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors hover:bg-red-50 hover:text-red-600"
          style={{ borderColor: "var(--border-subtle)", color: "var(--fg-muted)" }}
          aria-label="Clear all filters"
        >
          <X size={12} />
          Clear
        </button>
      )}

      {/* CSV export */}
      {exportUrl && (
        <a
          href={exportUrl}
          download
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--brand-primary)] hover:text-white"
          style={{
            borderColor: "var(--brand-primary)",
            color: "var(--brand-primary)",
          }}
          aria-label="Export as CSV"
        >
          ↓ Export CSV
        </a>
      )}
    </div>
  );
}
