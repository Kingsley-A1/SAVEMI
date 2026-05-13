"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

interface AdminShellProps {
  children: ReactNode;
  userName: string;
  isAuthenticated: boolean;
}

export default function AdminShell({
  children,
  userName,
  isAuthenticated,
}: AdminShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const isRegisterPage = pathname === "/admin/register";
  const showStandaloneAuthPage =
    isLoginPage || (!isAuthenticated && isRegisterPage);

  if (showStandaloneAuthPage) {
    return <div className="min-h-screen bg-[#f6f2e8]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#f3efe4] lg:flex">
      <AdminSidebar userName={userName} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-5 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
