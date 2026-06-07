import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMessageById } from "../../../lib/messages";
import MediaPlayer from "../../../components/MediaPlayer";
import MessageDownloadActions from "../../../components/MessageDownloadActions";
import { isEmbeddableUrl } from "../../../lib/embed";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const message = await getMessageById(id);

  if (!message) {
    return { title: "Message Not Found" };
  }

  return {
    title: message.title,
    description: message.summary,
    openGraph: {
      title: `${message.title} | SAVEMI`,
      description: message.summary,
      type: "article",
    },
    alternates: { canonical: `/messages/${id}` },
  };
}

export default async function MessageDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const message = await getMessageById(id);

  if (!message) {
    notFound();
  }

  // Determine the best media source: prefer external URL, fall back to R2
  const mediaSrc = message.externalMediaUrl || message.downloadUrl;
  const isEmbed = message.externalMediaUrl
    ? isEmbeddableUrl(message.externalMediaUrl)
    : false;

  return (
    <article className="mx-auto max-w-3xl space-y-4">
      <div className="site-panel p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="type-badge">{message.type}</span>
          <span className="text-brand-muted text-xs">{message.date}</span>
          {message.category ? (
            <span className="text-brand-muted text-xs">{message.category}</span>
          ) : null}
        </div>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          {message.title}
        </h1>

        <p className="text-brand-muted mt-2 text-sm leading-6">
          {message.summary}
        </p>

        <dl className="text-brand-muted mt-3 flex flex-col gap-1 text-xs">
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
      </div>

      {mediaSrc ? (
        <div className="site-panel overflow-hidden p-4">
          <MediaPlayer
            src={mediaSrc}
            type={message.type}
            title={message.title}
          />
        </div>
      ) : (
        <div className="site-panel p-6 text-center">
          <p className="text-brand-muted text-sm">
            Media will appear here once storage integration is connected.
          </p>
        </div>
      )}

      {message.description ? (
        <div className="site-panel p-4 sm:p-6">
          <h2 className="eyebrow text-brand-primary">Overview</h2>
          <p className="text-brand-muted mt-2 text-sm leading-6">
            {message.description}
          </p>

          <MessageDownloadActions
            type={message.type}
            title={message.title}
            mediaDownloadUrl={!isEmbed ? message.downloadUrl : null}
            audioDownloadUrl={message.audioDownloadUrl}
            originalUrl={isEmbed ? message.externalMediaUrl : null}
          />

          {/* For embeds, link to the original platform */}
          {isEmbed && message.externalMediaUrl ? (
            <a
              href={message.externalMediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button-tertiary mt-4 inline-flex"
            >
              Watch on original platform ↗
            </a>
          ) : null}
        </div>
      ) : null}

      <Link
        href="/messages"
        className="text-brand-muted hover:text-brand-primary inline-block text-sm transition-colors"
      >
        ← Back to messages
      </Link>
    </article>
  );
}
