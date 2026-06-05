import Link from "next/link";
import { notFound } from "next/navigation";
import MediaPlayer from "../../../../../../components/MediaPlayer";
import { isEmbeddableUrl } from "../../../../../../lib/embed";
import { isDatabaseConfigured, prisma } from "../../../../../../lib/db";
import { resolveAssetUrl } from "../../../../../../lib/r2";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDate(value: Date | null) {
  if (!value) return "Date to be confirmed";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function AdminMessagePreviewPage({ params }: Props) {
  const { id } = await params;

  if (!isDatabaseConfigured()) {
    return (
      <div className="site-panel p-6 text-center text-sm text-brand-muted">
        Database not configured.
      </div>
    );
  }

  const message = await prisma.message.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      description: true,
      type: true,
      status: true,
      speaker: true,
      scriptureReference: true,
      eventDate: true,
      publishedAt: true,
      createdAt: true,
      mediaKey: true,
      coverImageKey: true,
      externalMediaUrl: true,
      category: { select: { name: true } },
    },
  });

  if (!message) notFound();

  const mediaSrc =
    message.externalMediaUrl || (await resolveAssetUrl(message.mediaKey));
  const isEmbed = message.externalMediaUrl
    ? isEmbeddableUrl(message.externalMediaUrl)
    : false;

  return (
    <article className="mx-auto max-w-3xl space-y-4">
      <div className="site-panel p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="type-badge">{message.type.toLowerCase()}</span>
            <span
              className="inline-block rounded px-2 py-0.5 text-xs font-semibold"
              style={{
                background: "rgba(10,79,60,0.08)",
                color: "var(--brand-primary)",
              }}
            >
              {formatStatus(message.status)}
            </span>
            <span className="text-brand-muted text-xs">
              {formatDate(
                message.eventDate ?? message.publishedAt ?? message.createdAt,
              )}
            </span>
          </div>
          <Link
            href={`/admin/messages/${message.id}/edit`}
            className="button-tertiary"
          >
            Edit
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
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
          {message.category?.name ? (
            <div>
              <dt className="inline font-medium">Category: </dt>
              <dd className="inline">{message.category.name}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {mediaSrc ? (
        <div className="site-panel overflow-hidden p-4">
          <MediaPlayer
            src={mediaSrc}
            type={message.type.toLowerCase() as "video" | "audio" | "image"}
            title={message.title}
          />
        </div>
      ) : (
        <div className="site-panel p-6 text-center">
          <p className="text-brand-muted text-sm">
            No media is linked to this message yet.
          </p>
        </div>
      )}

      <div className="site-panel p-4 sm:p-6">
        <h2 className="eyebrow text-brand-primary">Overview</h2>
        <p className="text-brand-muted mt-2 text-sm leading-6">
          {message.description}
        </p>

        {message.status === "PUBLISHED" ? (
          <Link
            href={`/messages/${message.slug}`}
            className="button-primary mt-4 inline-flex"
            target="_blank"
          >
            Open public page
          </Link>
        ) : null}

        {isEmbed && message.externalMediaUrl ? (
          <a
            href={message.externalMediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button-tertiary mt-4 inline-flex"
          >
            Open original platform
          </a>
        ) : null}
      </div>
    </article>
  );
}
