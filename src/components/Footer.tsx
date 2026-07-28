import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import SocialLinks from "./SocialLinks";
import type { SiteSettings, SocialLink } from "../lib/site-settings";

export default function Footer({
  settings,
  socialLinks,
}: {
  settings?: SiteSettings;
  socialLinks?: SocialLink[];
}) {
  const contactEmail = settings?.contactEmail ?? "";
  const contactPhone = settings?.contactPhone ?? "";
  const address = settings?.address ?? "Calabar, Nigeria";

  return (
    <footer
      style={{
        background: "var(--brand-surface-strong)",
        borderTop: "1px solid var(--brand-border)",
      }}
    >
      <div className="site-container py-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-brand-primary text-sm font-semibold">
              SAVEMI Ministry
            </p>
            <p className="text-brand-muted mt-0.5 text-xs">
              Sabbath Vesper Ministry — Repose · Renewal · Restoration
            </p>

            <ul className="text-brand-muted mt-3 flex flex-col gap-1.5 text-xs">
              {address ? (
                <li className="flex items-center gap-2">
                  <MapPin size={13} aria-hidden="true" />
                  {address}
                </li>
              ) : null}
              {contactEmail ? (
                <li className="flex items-center gap-2">
                  <Mail size={13} aria-hidden="true" />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="hover:text-brand-primary transition-colors"
                  >
                    {contactEmail}
                  </a>
                </li>
              ) : null}
              {contactPhone ? (
                <li className="flex items-center gap-2">
                  <Phone size={13} aria-hidden="true" />
                  <a
                    href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                    className="hover:text-brand-primary transition-colors"
                  >
                    {contactPhone}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <SocialLinks links={socialLinks} variant="icons" />
            <Link
              href="/admin"
              className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <ShieldCheck size={13} aria-hidden="true" />
              Admin portal
            </Link>
          </div>
        </div>

        <p className="text-brand-muted mt-5 text-xs">
          &copy; {new Date().getFullYear()} SAVEMI Ministry. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
