import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Database,
  ExternalLink,
  FileText,
  HeartHandshake,
  Library,
  MessageSquare,
  ShieldCheck,
  UploadCloud,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Owner Guide | SAVEMI Admin",
  description: "SAVEMI website operating guide for platform owners.",
};

interface GuideCard {
  title: string;
  body: string;
  icon: LucideIcon;
}

interface Row {
  label: string;
  value: string;
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div>
        <p className="eyebrow text-brand-primary">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function CardGrid({ items }: { items: readonly GuideCard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ title, body, icon: Icon }) => (
        <article key={title} className="site-panel p-4">
          <Icon size={19} style={{ color: "var(--brand-primary)" }} />
          <h3 className="mt-3 text-sm font-semibold">{title}</h3>
          <p className="text-brand-muted mt-1 text-sm leading-6">{body}</p>
        </article>
      ))}
    </div>
  );
}

function Checklist({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-6">
          <CheckCircle2
            size={16}
            className="mt-0.5 shrink-0"
            style={{ color: "var(--brand-primary)" }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DetailRows({ rows }: { rows: readonly Row[] }) {
  return (
    <div className="site-panel overflow-hidden">
      <div className="divide-y" style={{ borderColor: "var(--brand-border)" }}>
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[12rem_1fr]"
          >
            <p className="font-semibold">{row.label}</p>
            <p className="text-brand-muted leading-6">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const operatingRooms: readonly GuideCard[] = [
  {
    title: "Public Library",
    body: "Visitors read, watch, listen, download, and contact the ministry here. It only shows published content.",
    icon: Library,
  },
  {
    title: "Admin Office",
    body: "Approved operators create drafts, publish content, check contacts, review health, and manage records.",
    icon: ShieldCheck,
  },
  {
    title: "Records Room",
    body: "CockroachDB stores content records, admin users, contact messages, generated slugs, and audit events.",
    icon: Database,
  },
  {
    title: "Media Cabinet",
    body: "Cloudflare R2 stores large files such as videos, audio, covers, quote images, and downloadable assets.",
    icon: UploadCloud,
  },
];

const publicPages: readonly Row[] = [
  { label: "Home", value: "Introduces SAVEMI with the fixed Sabbath reflection hero, featured video/audio, and ministry calls to action." },
  { label: "About", value: "Explains Sabbath Vesper Ministry, its mission, location, and seventh-day Sabbath focus." },
  { label: "Contact", value: "Lets visitors send private messages to the ministry office." },
  { label: "Messages", value: "Lists published videos, audios, and image-based ministry messages." },
  { label: "Books", value: "Lists approved books, downloads, and ministry resources." },
  { label: "Quotes", value: "Shows published reflections, Bible-linked statements, and quote images." },
];

const adminPages: readonly Row[] = [
  { label: "Dashboard", value: "Shows operating KPIs and quick actions for content work." },
  { label: "Messages", value: "Creates, edits, publishes, archives, filters, and exports message records." },
  { label: "Books", value: "Manages free and paid ministry resources, covers, descriptions, and links." },
  { label: "Quotes", value: "Manages short reflections, attribution, scripture references, and quote images." },
  { label: "Contacts", value: "Reads visitor contact submissions. Treat these messages as private correspondence." },
  { label: "Admin Users", value: "Lets the configured super admin create, update, and remove admin accounts." },
  { label: "Platform Health", value: "Shows database health, migration warnings, audit status, content counts, and admin activity." },
  { label: "Audit Log", value: "Shows recent admin write actions for accountability and investigation." },
  { label: "Guide", value: "This page. It is the in-app version of the owner operating handbook." },
];

const publishingChecks = [
  "Prepare content offline before opening the admin office.",
  "Create the record as Draft first.",
  "Add title, summary, description, media, scripture reference, and source details where needed.",
  "Let the website generate the public slug from the title.",
  "Review spelling, Bible references, media playback, and links.",
  "Publish only after owner or approved editor review.",
  "Open the public page on phone and desktop after publishing.",
];

const launchChecks = [
  "Home, About, Contact, Messages, Books, and Quotes have been reviewed.",
  "Anonymous visitors cannot open admin pages.",
  "Anonymous visitors cannot use admin APIs.",
  "At least one approved admin can sign in.",
  "Admin Users shows only appropriate operators.",
  "Platform Health shows no unresolved audit or schema warning.",
  "Audit Log records admin write actions.",
  "R2 uploads work from the production and local development origins.",
  "Draft and archived content do not appear publicly.",
  "Production migrations have completed successfully.",
];

const breakFixRows: readonly Row[] = [
  {
    label: "Public site down",
    value: "Report the exact page address, time, and visible error. The cause may be hosting, domain, database, or deployment.",
  },
  {
    label: "Admin login fails",
    value: "Check the approved admin email and current six-character access code, then ask engineering to verify auth environment variables.",
  },
  {
    label: "Content missing",
    value: "Confirm the record is Published, saved correctly, and that the public address did not change after a title edit.",
  },
  {
    label: "Upload fails",
    value: "Check R2 credentials, bucket permissions, file type, file size, and CORS. Browser uploads require PUT from the website origin.",
  },
  {
    label: "Health warning",
    value: "Do not approve launch while Platform Health reports audit or schema warnings. Ask engineering to confirm migrations and rerun checks.",
  },
];

const knowledgeRows: readonly Row[] = [
  {
    label: "Know by heart",
    value: "Draft is private. Published is public. Archived is hidden but preserved. Admin access is powerful and must stay limited.",
  },
  {
    label: "Recognize",
    value: "Public pages, admin pages, generated slugs, exports, audit log, platform health, R2, and database migrations.",
  },
  {
    label: "Lookup only",
    value: "Vercel deployment details, CockroachDB management, Prisma migration commands, R2 bucket settings, and formal accessibility audits.",
  },
];

export default function AdminGuidePage() {
  return (
    <div className="space-y-8">
      <div className="site-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow text-brand-primary">SAVEMI Website Zero To Hero</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Owner Operating Guide
            </h1>
            <p className="text-brand-muted mt-3 text-sm leading-6">
              This page is the in-app version of the SAVEMI owner handbook. It
              explains how the public website, admin office, database, media
              storage, publishing workflow, health checks, and launch discipline
              work together.
            </p>
            <p className="text-brand-muted mt-3 text-sm leading-6">
              Foundation text: &quot;Remember the sabbath day, to keep it
              holy.&quot; - Exodus 20:8, KJV.
            </p>
          </div>
          <Link
            href="/admin/health"
            className="button-tertiary inline-flex shrink-0 items-center gap-1.5"
          >
            <ExternalLink size={14} />
            Open Health
          </Link>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Guide sections">
        {[
          ["System", "#system"],
          ["Pages", "#pages"],
          ["Publishing", "#publishing"],
          ["Access", "#access"],
          ["Launch", "#launch"],
          ["Break Fix", "#break-fix"],
        ].map(([label, href]) => (
          <a key={href} href={href} className="button-tertiary">
            {label}
          </a>
        ))}
      </nav>

      <Section id="system" eyebrow="Mental Model" title="Four Rooms Of The Website">
        <CardGrid items={operatingRooms} />
      </Section>

      <Section id="pages" eyebrow="Maps" title="Public And Admin Page Responsibilities">
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <HeartHandshake size={18} style={{ color: "var(--brand-primary)" }} />
              <h3 className="text-sm font-semibold">Public Website</h3>
            </div>
            <DetailRows rows={publicPages} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users size={18} style={{ color: "var(--brand-primary)" }} />
              <h3 className="text-sm font-semibold">Admin Office</h3>
            </div>
            <DetailRows rows={adminPages} />
          </div>
        </div>
      </Section>

      <Section id="publishing" eyebrow="Workflow" title="Publishing Without Surprises">
        <div className="site-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList size={18} style={{ color: "var(--brand-primary)" }} />
            <h3 className="text-sm font-semibold">Owner Publishing Flow</h3>
          </div>
          <Checklist items={publishingChecks} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="site-panel p-4">
            <MessageSquare size={18} style={{ color: "var(--brand-primary)" }} />
            <h3 className="mt-3 text-sm font-semibold">Messages</h3>
            <p className="text-brand-muted mt-1 text-sm leading-6">
              Use messages for sermons, Sabbath reflections, audio teachings,
              and image posts. The home hero is fixed content and is not managed
              from uploads.
            </p>
          </article>
          <article className="site-panel p-4">
            <BookOpen size={18} style={{ color: "var(--brand-primary)" }} />
            <h3 className="mt-3 text-sm font-semibold">Books</h3>
            <p className="text-brand-muted mt-1 text-sm leading-6">
              Use books for ministry resources. Free resources need a reliable
              download or resource URL. Paid resources need a tested purchase URL.
            </p>
          </article>
          <article className="site-panel p-4">
            <FileText size={18} style={{ color: "var(--brand-primary)" }} />
            <h3 className="mt-3 text-sm font-semibold">Quotes</h3>
            <p className="text-brand-muted mt-1 text-sm leading-6">
              Use quotes for short reflections and image encouragements. Check
              attribution, source, scripture reference, and mobile readability.
            </p>
          </article>
        </div>
      </Section>

      <Section id="access" eyebrow="Security" title="Admin Access Rules">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="site-panel p-5">
            <ShieldCheck size={19} style={{ color: "var(--brand-primary)" }} />
            <h3 className="mt-3 text-sm font-semibold">Normal Admins</h3>
            <p className="text-brand-muted mt-1 text-sm leading-6">
              Normal admins sign in with an approved email and the current
              six-character admin access code. The email must exist in the admin
              user list before login works.
            </p>
          </article>
          <article className="site-panel p-5">
            <Users size={19} style={{ color: "var(--brand-primary)" }} />
            <h3 className="mt-3 text-sm font-semibold">Super Admin</h3>
            <p className="text-brand-muted mt-1 text-sm leading-6">
              The configured super admin manages admin accounts from
              `/admin/admin-users`. Do not share admin access with temporary
              helpers or people who only need to view public content.
            </p>
          </article>
        </div>
      </Section>

      <Section id="launch" eyebrow="Readiness" title="Launch And Health Checklist">
        <div className="site-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={18} style={{ color: "#b45309" }} />
            <h3 className="text-sm font-semibold">Launch Gate</h3>
          </div>
          <Checklist items={launchChecks} />
        </div>
      </Section>

      <Section id="break-fix" eyebrow="Operations" title="What To Do When Something Breaks">
        <DetailRows rows={breakFixRows} />
      </Section>

      <Section id="knowledge" eyebrow="Ownership" title="What The Owner Must Know">
        <DetailRows rows={knowledgeRows} />
      </Section>

      <div className="site-panel p-5 text-sm leading-6 text-brand-muted">
        Written by Bespoke Technologies, bespoketech.com.ng
        Engineering the solutions for this and the next generation.
      </div>
    </div>
  );
}
