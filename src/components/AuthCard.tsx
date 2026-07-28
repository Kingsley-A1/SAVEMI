import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Shared shell for the public sign-in and registration cards, so both wear
 * the same ministry mark and spacing as the admin equivalents.
 */
export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-sm py-6">
      <div className="site-panel p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/images/logo.jpg"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-lg object-contain"
          />
          <div className="min-w-0">
            <p className="eyebrow text-brand-primary">SAVEMI</p>
            <h1 className="mt-0.5 text-lg font-semibold leading-tight">
              {title}
            </h1>
          </div>
        </div>

        <p className="text-brand-muted mb-5 text-xs leading-5">{subtitle}</p>

        {children}
      </div>

      {footer ? (
        <p className="text-brand-muted mt-5 text-center text-xs">{footer}</p>
      ) : null}
    </div>
  );
}
