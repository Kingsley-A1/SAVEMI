import { getSocialLinks, type SocialLink } from "../lib/social";
import { SOCIAL_ICONS } from "./SocialIcons";

interface SocialLinksProps {
  /**
   * Handles to render. Server components pass the owner-managed list from
   * Admin → Settings; when omitted the environment-configured handles are
   * used, so this component works in client trees too.
   */
  links?: SocialLink[];
  /** "icons" = compact icon buttons; "cards" = icon + label + handle rows. */
  variant?: "icons" | "cards";
  /** Render icons in the current text colour instead of brand colours. */
  mono?: boolean;
  className?: string;
}

export default function SocialLinks({
  links: providedLinks,
  variant = "icons",
  mono = false,
  className,
}: SocialLinksProps) {
  const links = providedLinks ?? getSocialLinks();

  if (links.length === 0) return null;

  if (variant === "cards") {
    return (
      <ul className={`grid gap-3 sm:grid-cols-2 ${className ?? ""}`}>
        {links.map(({ platform, label, href, handle }) => {
          const Icon = SOCIAL_ICONS[platform];
          const isExternal = href.startsWith("http");
          return (
            <li key={platform}>
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-white"
                style={{ borderColor: "var(--brand-border)" }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(10,79,60,0.06)" }}
                >
                  <Icon size={20} mono={mono} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-brand-primary">
                    {label}
                  </span>
                  <span className="text-brand-muted block truncate text-xs">
                    {handle}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className ?? ""}`}>
      {links.map(({ platform, label, href }) => {
        const Icon = SOCIAL_ICONS[platform];
        const isExternal = href.startsWith("http");
        return (
          <a
            key={platform}
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            aria-label={label}
            title={label}
            className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-white"
            style={{ borderColor: "var(--brand-border)" }}
          >
            <Icon size={18} mono={mono} title={label} />
          </a>
        );
      })}
    </div>
  );
}
