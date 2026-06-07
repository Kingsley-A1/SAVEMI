import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Download,
  Film,
  Headphones,
  Library,
  Search,
} from "lucide-react";
import type { Message, MessageType } from "../lib/messages";

interface MessageTypeLibraryConfig {
  type: MessageType;
  typeLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  searchLabel: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  actionLabel: string;
  downloadLabel: string;
  icon: LucideIcon;
  allHref: string;
  allLabel: string;
  companionHref: string;
  companionLabel: string;
}

interface MessageTypeLibraryProps {
  items: Message[];
  search: string;
  config: MessageTypeLibraryConfig;
}

export const messageLibraryConfigs = {
  audio: {
    type: "audio",
    typeLabel: "Audio",
    eyebrow: "Listen",
    title: "Audio Messages",
    description:
      "Sabbath reflections, devotionals, and vesper teachings arranged for quiet listening.",
    searchLabel: "Search audio",
    searchPlaceholder: "Title, summary, scripture, or speaker",
    emptyTitle: "No audio messages found",
    emptyDescription:
      "Try a broader search, or return to the full audio library.",
    actionLabel: "Listen",
    downloadLabel: "Download audio",
    icon: Headphones,
    allHref: "/messages",
    allLabel: "All messages",
    companionHref: "/messages?type=video",
    companionLabel: "Video messages",
  },
  video: {
    type: "video",
    typeLabel: "Video",
    eyebrow: "Watch",
    title: "Video Messages",
    description:
      "Sabbath teachings and Reflection at Eventide videos from SAVEMI.",
    searchLabel: "Search videos",
    searchPlaceholder: "Title, summary, scripture, or speaker",
    emptyTitle: "No video messages found",
    emptyDescription:
      "Try a broader search, or return to the full video library.",
    actionLabel: "Watch",
    downloadLabel: "Download video",
    icon: Film,
    allHref: "/messages",
    allLabel: "All messages",
    companionHref: "/audio",
    companionLabel: "Audio messages",
  },
} satisfies Record<"audio" | "video", MessageTypeLibraryConfig>;

function getMediaStatus(message: Message, config: MessageTypeLibraryConfig) {
  if (message.downloadUrl || message.externalMediaUrl) {
    return `${config.typeLabel} available`;
  }

  return "Media coming soon";
}

function MessageTypeCard({
  message,
  config,
}: {
  message: Message;
  config: MessageTypeLibraryConfig;
}) {
  const Icon = config.icon;
  const detailHref = `/messages/${message.slug}`;

  return (
    <article className="site-panel flex h-full flex-col p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded"
          style={{ background: "rgba(10,79,60,0.08)" }}
        >
          <Icon size={21} style={{ color: "var(--brand-primary)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="type-badge inline-flex items-center gap-1.5">
              <Icon size={12} aria-hidden="true" />
              {config.typeLabel}
            </span>
            <span className="text-brand-muted text-xs">{message.date}</span>
          </div>

          <Link href={detailHref} className="group">
            <h2 className="mt-3 text-base font-semibold leading-snug transition-colors group-hover:text-brand-primary">
              {message.title}
            </h2>
          </Link>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {message.speaker || message.scriptureReference ? (
          <dl className="text-brand-muted flex flex-col gap-1 text-xs">
            {message.speaker ? (
              <div>
                <dt className="inline font-medium">Speaker: </dt>
                <dd className="inline">{message.speaker}</dd>
              </div>
            ) : null}
            {message.scriptureReference ? (
              <div>
                <dt className="inline font-medium">Scripture: </dt>
                <dd className="inline">{message.scriptureReference}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        <p className="text-brand-muted line-clamp-3 text-sm leading-6">
          {message.summary}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-5">
        <p className="text-brand-muted text-xs">
          {getMediaStatus(message, config)}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={detailHref}
            className="button-primary gap-1.5"
            aria-label={`${config.actionLabel} to ${message.title}`}
          >
            <Icon size={14} aria-hidden="true" />
            {config.actionLabel}
          </Link>
          {message.downloadUrl ? (
            <a
              href={message.downloadUrl}
              download
              className="button-tertiary gap-1.5"
              aria-label={`${config.downloadLabel} for ${message.title}`}
            >
              <Download size={14} aria-hidden="true" />
              Download
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function MessageTypeLibrary({
  items,
  search,
  config,
}: MessageTypeLibraryProps) {
  const Icon = config.icon;
  const hasSearch = Boolean(search);
  const downloadableCount = items.filter((item) => item.downloadUrl).length;

  return (
    <section className="space-y-5">
      <div className="site-panel overflow-hidden">
        <div
          className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end"
          style={{
            background:
              "linear-gradient(135deg, rgba(10,79,60,0.08) 0%, rgba(255,253,247,0) 68%)",
          }}
        >
          <div>
            <p className="eyebrow text-brand-primary">{config.eyebrow}</p>
            <h1 className="section-title mt-2">{config.title}</h1>
            <p className="section-copy mt-2">{config.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={config.allHref} className="button-tertiary gap-1.5">
                <Library size={14} aria-hidden="true" />
                {config.allLabel}
              </Link>
              <Link
                href={config.companionHref}
                className="button-tertiary gap-1.5"
              >
                <ArrowRight size={14} aria-hidden="true" />
                {config.companionLabel}
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-2 rounded-lg border bg-white/80 p-3 text-sm sm:max-w-sm lg:max-w-none">
            <div>
              <dt className="text-brand-muted text-xs">Results</dt>
              <dd className="text-2xl font-semibold text-brand-primary">
                {items.length}
              </dd>
            </div>
            <div>
              <dt className="text-brand-muted text-xs">Download ready</dt>
              <dd className="text-2xl font-semibold text-brand-primary">
                {downloadableCount}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <form
        className="site-panel grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
        action={`/${config.type}`}
      >
        <div>
          <label htmlFor={`${config.type}-search`} className="field-label">
            {config.searchLabel}
          </label>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--brand-text-soft)" }}
              aria-hidden="true"
            />
            <input
              id={`${config.type}-search`}
              name="search"
              className="field-input pl-9"
              placeholder={config.searchPlaceholder}
              defaultValue={search}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="button-primary gap-1.5">
            <Search size={14} aria-hidden="true" />
            Search
          </button>
          {hasSearch ? (
            <Link href={`/${config.type}`} className="button-tertiary">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="site-panel p-6 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded"
            style={{ background: "rgba(10,79,60,0.08)" }}
          >
            <Icon size={22} style={{ color: "var(--brand-primary)" }} />
          </div>
          <h2 className="mt-4 text-base font-semibold">{config.emptyTitle}</h2>
          <p className="text-brand-muted mx-auto mt-2 max-w-md text-sm leading-6">
            {config.emptyDescription}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((message) => (
            <li key={message.id}>
              <MessageTypeCard message={message} config={config} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
