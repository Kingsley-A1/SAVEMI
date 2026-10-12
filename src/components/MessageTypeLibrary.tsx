import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Film, Headphones, Image as ImageIcon, Play, Search, X } from "lucide-react";
import type { Message, MessageType } from "../lib/messages";
import AudioRow from "./AudioRow";
import ImageGallery from "./ImageGallery";
import VideoThumbnail from "./VideoThumbnail";

interface MessageTypeLibraryConfig {
  type: MessageType;
  path: string;
  title: string;
  searchLabel: string;
  emptyTitle: string;
  icon: LucideIcon;
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
    title: "Audio",
    searchLabel: "Search audio",
    emptyTitle: "No audio messages found",
    icon: Headphones,
  },
  video: {
    type: "video",
    path: "/videos",
    title: "Videos",
    searchLabel: "Search videos",
    emptyTitle: "No video messages found",
    icon: Film,
  },
  image: {
    type: "image",
    path: "/images",
    title: "Images",
    searchLabel: "Search images",
    emptyTitle: "No image messages found",
    icon: ImageIcon,
  },
} satisfies Record<"audio" | "video" | "image", MessageTypeLibraryConfig>;

/** Title on the left, search on the right — one line, nothing else. */
export function LibraryHeader({
  title,
  path,
  search,
  searchLabel,
  children,
}: {
  title: string;
  path: string;
  search: string;
  searchLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <h1 className="section-title">{title}</h1>
      <form
        action={path}
        role="search"
        className="ml-auto flex min-w-0 flex-1 basis-56 items-center gap-2 sm:max-w-md"
      >
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--brand-text-soft)" }}
            aria-hidden="true"
          />
          <input
            name="search"
            type="search"
            aria-label={searchLabel}
            placeholder="Search"
            className="field-input pl-9 pr-9"
            defaultValue={search}
          />
          {search ? (
            <Link
              href={path}
              className="text-brand-muted hover:text-brand-primary absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center"
              aria-label="Clear search"
            >
              <X size={14} />
            </Link>
          ) : null}
        </div>
        {children}
      </form>
    </div>
  );
}

function VideoCard({ message }: { message: Message }) {
  return (
    <Link
      href={`/messages/${message.slug}`}
      className="group block"
      aria-label={`Watch ${message.title}`}
    >
      <div
        className="relative aspect-video overflow-hidden rounded-xl"
        style={{ background: "var(--brand-primary-deep)" }}
      >
        <VideoThumbnail
          imageUrl={message.thumbnailUrl}
          videoUrl={message.previewVideoUrl}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/15">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
            <Play size={20} className="ml-0.5 fill-white text-white" />
          </span>
        </div>
      </div>
      <h2 className="mt-2.5 line-clamp-2 text-base font-semibold leading-snug transition-colors group-hover:text-brand-primary">
        {message.title}
      </h2>
      {message.speaker ? (
        <p className="text-brand-muted mt-0.5 truncate text-sm">{message.speaker}</p>
      ) : null}
    </Link>
  );
}

export default function MessageTypeLibrary({
  items,
  search,
  config,
}: MessageTypeLibraryProps) {
  const Icon = config.icon;

  return (
    <section className="space-y-5">
      <LibraryHeader
        title={config.title}
        path={config.path}
        search={search}
        searchLabel={config.searchLabel}
      />

      {items.length === 0 ? (
        <div className="site-panel flex flex-col items-center gap-3 p-8 text-center">
          <Icon size={24} style={{ color: "var(--brand-primary)" }} aria-hidden="true" />
          <p className="text-brand-muted text-sm">{config.emptyTitle}</p>
        </div>
      ) : config.type === "image" ? (
        <ImageGallery
          images={items.map((message) => ({
            id: message.id,
            slug: message.slug,
            title: message.title,
            src: message.thumbnailUrl,
            fullSrc: message.downloadUrl ?? message.externalMediaUrl,
          }))}
        />
      ) : config.type === "audio" ? (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((message) => (
            <li key={message.id}>
              <AudioRow
                slug={message.slug}
                title={message.title}
                speaker={message.speaker}
                coverImageUrl={message.coverImageUrl}
              />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((message) => (
            <li key={message.id}>
              <VideoCard message={message} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
