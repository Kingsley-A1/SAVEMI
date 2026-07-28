"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton({
  label = "Sign out",
  callbackUrl = "/",
  className = "button-primary inline-flex items-center gap-1.5",
}: {
  label?: string;
  callbackUrl?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl })}
      className={className}
    >
      <LogOut size={15} />
      {label}
    </button>
  );
}
