import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Film,
  Headphones,
  Image as ImageIcon,
  Play,
  Search,
} from "lucide-react";
import type { Message, MessageType } from "../lib/messages";

interface MessageTypeLibraryConfig {
  type: MessageType;
  path: string;
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
  companionLinks: Array<{
    href: string;
    label: string;
  }>;
}

interface MessageTypeLibraryProps {
  items: Message[];
  search: string;
  config: MessageTypeLibraryConfig;
}

export const messageLibraryConfigs = {
  audio: {
    type: "audio",
    path: "/audio",
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
    companionLinks: [
      { href: "/videos", label: "Video messages" },
      { href: "/images", label: "Image messages" },
    ],
  },
  video: {
    type: "video",
    path: "/videos",
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
    companionLinks: [
      { href: "/audio", label: "Audio messages" },
      { href: "/images", label: "Image messages" },
    ],
  },
  image: {
    type: "image",
    path: "/images",
    typeLabel: "Image",
    eyebrow: "Reflect",
    title: "Image Messages",
    description:
      "Scripture-rooted visual messages, quotes, and Sabbath reflections for quick review and sharing.",
    searchLabel: "Search images",
    searchPlaceholder: "Title, summary, scripture, or speaker",
    emptyTitle: "No image messages found",
    emptyDescription:
      "Try a broader search, or return to another media library.",
    actionLabel: "View",
    downloadLabel: "Download image",
    icon: ImageIcon,
    companionLinks: [
      { href: "/audio", label: "Audio messages" },
      { href: "/videos", label: "Video messages" },
    ],
  },
} satisfies Record<"audio" | "video" | "image", MessageTypeLibraryConfig>;

// Video: a face — title, preacher, one CTA — everything else waits behind
// the click. Image / audio: the photograph carries the whole card; no text
// sits on top of it until the visitor opens it.
function MessageTypeCard({
  message,
  config,
}: {
  message: Message;
  config: MessageTypeLibraryConfig;
}) {
  const Icon = config.icon;
  const detailHref = `/messages/${message.slug}`;
  const previewUrl =
    config.type === "image"
      ? (message.coverImageUrl ?? message.downloadUrl)
      : message.coverImageUrl;

  if (config.type === "video") {
    return (
      <article className="site-panel flex h-full flex-col overflow-hidden">
        <Link href={detailHref} className="group block">
          <div
            className="relative aspect-video overflow-hidden"
            style={{ background: "var(--brand-primary-deep)" }}
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt=""
                fill
                quality={90}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Icon size={34} style={{ color: "#86efac" }} />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/15">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                <Play size={20} className="ml-0.5 fill-white text-white" />
              </span>
            </div>
          </div>
        </Link>

        <div className="flex flex-1 flex-col gap-1 p-4 sm:p-5">
          <Link href={detailHref} className="group">
            <h2 className="text-base font-semibold leading-snug transition-colors group-hover:text-brand-primary">
              {message.title}
            </h2>
          </Link>
          {message.speaker ? (
            <p className="text-brand-muted text-sm">{message.speaker}</p>
          ) : null}
          <Link
            href={detailHref}
            className="button-primary mt-3 w-fit gap-1.5"
            aria-label={`${config.actionLabel} ${message.title}`}
          >
            <Icon size={14} aria-hidden="true" />
            {config.actionLabel}
          </Link>
        </div>
      </article>
    );
  }

  return (
    <Link
      href={detailHref}
      className="media-tile group block"
      aria-label={`${message.title}${message.speaker ? ` — ${message.speaker}` : ""}`}
    >
      <div
        className="relative aspect-[4/5] w-full overflow-hidden"
        style={{ background: "var(--brand-primary-deep)" }}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt=""
            fill
            quality={90}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon size={34} style={{ color: "#86efac" }} />
          </div>
        )}

        {config.type === "audio" ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/15">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 opacity-90 backdrop-blur-sm">
              <Headphones size={18} className="text-white" />
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default function MessageTypeLibrary({
  items,
  search,
  config,
}: MessageTypeLibraryProps) {
  const Icon = config.icon;
  const hasSearch = Boolean(search);
  const downloadableCount = items.filter((item) => item.downloadHref).length;

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
              {config.companionLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="button-tertiary gap-1.5"
                >
                  <ArrowRight size={14} aria-hidden="true" />
                  {link.label}
                </Link>
              ))}
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
        action={config.path}
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
            <Link href={config.path} className="button-tertiary">
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
        <ul
          className={
            config.type === "video"
              ? "grid grid-cols-1 gap-4 lg:grid-cols-2"
              : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          }
        >
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
