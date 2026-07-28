import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import {
  getInitials,
  getTeamGroups,
  TEAM_ROLE_LABEL,
  type TeamMember,
} from "../../lib/team";
import {
  EmailIcon,
  FacebookIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "../../components/SocialIcons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Team",
  description:
    "Meet the people who serve Sabbath Vesper Ministry — the ministry anchor, pastoral team, coordinators, and media team behind SAVEMI.",
  openGraph: {
    title: "Our Team | SAVEMI",
    description:
      "Meet the people who serve Sabbath Vesper Ministry — repose, renewal, restoration.",
  },
  alternates: { canonical: "/team" },
};

/* ── Shared pieces ─────────────────────────────────────────── */

function MemberLinks({
  member,
  size = 18,
}: {
  member: TeamMember;
  size?: number;
}) {
  const links = [
    member.email
      ? {
          key: "email",
          href: `mailto:${member.email}`,
          label: `Email ${member.name}`,
          Icon: EmailIcon,
          external: false,
        }
      : null,
    member.whatsappUrl
      ? {
          key: "whatsapp",
          href: member.whatsappUrl,
          label: `WhatsApp ${member.name}`,
          Icon: WhatsAppIcon,
          external: true,
        }
      : null,
    member.facebookUrl
      ? {
          key: "facebook",
          href: member.facebookUrl,
          label: `${member.name} on Facebook`,
          Icon: FacebookIcon,
          external: true,
        }
      : null,
    member.youtubeUrl
      ? {
          key: "youtube",
          href: member.youtubeUrl,
          label: `${member.name} on YouTube`,
          Icon: YouTubeIcon,
          external: true,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    href: string;
    label: string;
    Icon: (props: { size?: number; title?: string }) => React.ReactElement;
    external: boolean;
  }>;

  if (links.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {links.map(({ key, href, label, Icon, external }) => (
        <a
          key={key}
          href={href}
          aria-label={label}
          title={label}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-white"
          style={{ borderColor: "var(--brand-border)" }}
        >
          <Icon size={size} />
        </a>
      ))}
    </div>
  );
}

function Portrait({
  member,
  className,
  sizes,
  rounded = "rounded-full",
  initialsClass = "text-2xl",
}: {
  member: TeamMember;
  className: string;
  sizes: string;
  rounded?: string;
  initialsClass?: string;
}) {
  if (member.photoUrl) {
    return (
      <div className={`relative overflow-hidden ${rounded} ${className}`}>
        <Image
          src={member.photoUrl}
          alt={`Portrait of ${member.name}`}
          fill
          sizes={sizes}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${rounded} ${className}`}
      style={{ background: "rgba(10,79,60,0.08)" }}
      aria-hidden="true"
    >
      <span
        className={`font-semibold ${initialsClass}`}
        style={{ color: "var(--brand-primary)" }}
      >
        {getInitials(member.name)}
      </span>
    </div>
  );
}

function Scripture({ member }: { member: TeamMember }) {
  if (!member.scriptureVerse) return null;

  return (
    <blockquote
      className="mt-4 border-l-[3px] py-0.5 pl-4"
      style={{ borderColor: "var(--brand-primary)" }}
    >
      <p className="text-sm italic leading-relaxed">
        &ldquo;{member.scriptureVerse}&rdquo;
      </p>
      {member.scriptureReference ? (
        <cite className="text-brand-primary mt-1.5 block text-xs font-semibold not-italic">
          — {member.scriptureReference}
        </cite>
      ) : null}
    </blockquote>
  );
}

/* ── The anchor: the largest card, given the most room ─────── */

function AnchorCard({ member }: { member: TeamMember }) {
  return (
    <article
      className="site-panel overflow-hidden"
      style={{ borderColor: "rgba(10,79,60,0.22)" }}
    >
      <div className="grid gap-0 md:grid-cols-[minmax(0,20rem)_1fr]">
        <div
          className="relative min-h-[18rem] md:min-h-full"
          style={{ background: "var(--brand-primary-deep)" }}
        >
          {member.photoUrl ? (
            <Image
              src={member.photoUrl}
              alt={`Portrait of ${member.name}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 20rem"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span
                className="text-5xl font-semibold"
                style={{ color: "rgba(241,231,201,0.55)" }}
              >
                {getInitials(member.name)}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8">
          <p className="eyebrow text-brand-primary">
            {TEAM_ROLE_LABEL.ANCHOR}
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
            {member.name}
          </h2>
          <p
            className="mt-1.5 text-sm font-semibold"
            style={{ color: "var(--brand-primary-soft)" }}
          >
            {member.title}
          </p>

          {member.bio ? (
            <p className="text-brand-muted mt-4 text-sm leading-7">
              {member.bio}
            </p>
          ) : null}

          <Scripture member={member} />
          <MemberLinks member={member} />
        </div>
      </div>
    </article>
  );
}

/* ── Everyone else: even, dignified cards ──────────────────── */

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <article className="site-panel flex h-full flex-col items-center p-5 text-center">
      <Portrait
        member={member}
        className="h-24 w-24 shrink-0"
        sizes="6rem"
        initialsClass="text-xl"
      />

      <h3 className="mt-4 text-base font-semibold leading-snug">
        {member.name}
      </h3>
      <p
        className="mt-1 text-xs font-semibold"
        style={{ color: "var(--brand-primary-soft)" }}
      >
        {member.title}
      </p>

      {member.bio ? (
        <p className="text-brand-muted mt-3 line-clamp-4 text-xs leading-6">
          {member.bio}
        </p>
      ) : null}

      <div className="mt-auto">
        <MemberLinks member={member} size={16} />
      </div>
    </article>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default async function TeamPage() {
  const groups = await getTeamGroups();
  const anchorGroup = groups.find((group) => group.role === "ANCHOR");
  const remainingGroups = groups.filter((group) => group.role !== "ANCHOR");

  return (
    <section className="space-y-8">
      <div className="site-panel p-5 sm:p-7">
        <p className="eyebrow text-brand-primary">Our Team</p>
        <h1 className="section-title mt-2">The people who serve</h1>
        <p className="section-copy mt-2">
          Sabbath Vesper Ministry is carried by people who give their time to
          teaching, worship, and quiet care for others. We are grateful for
          each one.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="site-panel px-6 py-14 text-center">
          <Users
            size={30}
            className="mx-auto opacity-40"
            style={{ color: "var(--brand-primary)" }}
          />
          <p className="text-brand-muted mt-3 text-sm">
            Our team will be introduced here soon.
          </p>
          <Link href="/contact" className="button-tertiary mt-4 inline-flex">
            Reach the ministry
          </Link>
        </div>
      ) : null}

      {anchorGroup?.members.map((member) => (
        <AnchorCard key={member.id} member={member} />
      ))}

      {remainingGroups.map((group) => (
        <section key={group.role} aria-labelledby={`team-${group.role}`}>
          <div className="mb-4 flex items-center gap-3">
            <h2
              id={`team-${group.role}`}
              className="text-lg font-semibold sm:text-xl"
            >
              {group.heading}
            </h2>
            <span
              className="h-px flex-1"
              style={{ background: "var(--brand-border)" }}
              aria-hidden="true"
            />
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.members.map((member) => (
              <li key={member.id}>
                <MemberCard member={member} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {groups.length > 0 ? (
        <div
          className="rounded-lg px-6 py-9 text-center sm:px-10"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-primary-deep) 0%, var(--brand-primary) 100%)",
          }}
        >
          <p className="eyebrow" style={{ color: "rgba(241,231,201,0.65)" }}>
            Serve With Us
          </p>
          <h2
            className="mt-2 text-xl font-semibold sm:text-2xl"
            style={{ color: "#fff8ea" }}
          >
            There is room for your gift
          </h2>
          <p
            className="mx-auto mt-3 max-w-md text-sm leading-6"
            style={{ color: "rgba(241,231,201,0.72)" }}
          >
            If God has placed a desire in you to serve, we would love to hear
            from you.
          </p>
          <Link href="/contact" className="hero-btn-primary mt-5 inline-flex">
            Get in touch
          </Link>
        </div>
      ) : null}
    </section>
  );
}
