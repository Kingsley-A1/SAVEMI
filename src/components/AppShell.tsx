"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import RouteProgress from "./ui/RouteProgress";
import InstallPrompt from "./InstallPrompt";
import OfflineNotice from "./OfflineNotice";

interface AppShellProps {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
}

export default function AppShell({ children, header, footer }: AppShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  // The home hero is photographic and full-bleed, so it meets the header
  // directly instead of floating inside the page's top padding.
  const isHome = pathname === "/";

  if (isAdminRoute) {
    return (
      <>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <main className="min-h-screen">{children}</main>
        <OfflineNotice />
        <InstallPrompt />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>

      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {header}

      <main id="main-content" className="flex-1" tabIndex={-1}>
        <div
          className={
            isHome
              ? "site-container pb-8 pt-0"
              : "site-container py-6 sm:py-8"
          }
        >
          {children}
        </div>
      </main>

      {footer}
      <OfflineNotice />
      <InstallPrompt />
    </div>
  );
}
