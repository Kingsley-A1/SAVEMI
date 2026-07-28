import Image from "next/image";
import Link from "next/link";
import { Compass, Home, PlayCircle, Mail } from "lucide-react";

export const metadata = {
  title: "Page not found",
  description:
    "The page you were looking for could not be found on the SAVEMI website.",
};

const DESTINATIONS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/videos", label: "Watch messages", icon: PlayCircle },
  { href: "/contact", label: "Contact us", icon: Mail },
];

export default function NotFound() {
  return (
    <section className="flex min-h-[65vh] flex-col items-center justify-center px-4 py-12 text-center">
      <Image
        src="/images/logo.jpg"
        alt="SAVEMI"
        width={64}
        height={64}
        className="h-16 w-16 rounded-full object-cover"
        priority
      />

      <p className="eyebrow text-brand-primary mt-6">Error 404</p>
      <h1 className="section-title mt-2">This page could not be found</h1>
      <p className="section-copy mx-auto mt-3 max-w-md">
        The page you were looking for may have been moved or no longer exists.
        Take a moment of repose, then continue from one of the paths below.
      </p>

      <blockquote
        className="mx-auto mt-7 max-w-md border-l-[3px] py-1 pl-4 text-left"
        style={{ borderColor: "var(--brand-primary)" }}
      >
        <p className="text-sm italic leading-relaxed">
          &ldquo;Come to Me, all you who labor and are heavy laden, and I will
          give you rest.&rdquo;
        </p>
        <cite className="text-brand-primary mt-2 block text-xs font-semibold not-italic">
          — Matthew 11:28 NKJV
        </cite>
      </blockquote>

      <nav
        className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
        aria-label="Helpful links"
      >
        {DESTINATIONS.map(({ href, label, icon: Icon }, index) => (
          <Link
            key={href}
            href={href}
            className={
              index === 0
                ? "button-primary inline-flex items-center gap-1.5"
                : "button-tertiary inline-flex items-center gap-1.5"
            }
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>

      <p className="text-brand-muted mt-7 inline-flex items-center gap-1.5 text-xs">
        <Compass size={13} aria-hidden="true" />
        Sabbath Vesper Ministry — Repose · Renewal · Restoration
      </p>
    </section>
  );
}
