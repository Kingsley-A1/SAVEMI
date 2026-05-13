"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

interface AppShellProps {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
}

export default function AppShell({ children, header, footer }: AppShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {header}
      <main className="flex-1">
        <div className="site-container py-6 sm:py-8">{children}</div>
      </main>
      {footer}
    </div>
  );
}
