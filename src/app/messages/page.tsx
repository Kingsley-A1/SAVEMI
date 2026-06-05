import type { Metadata } from "next";
import { getMessages } from "../../lib/messages";
import MessageCard from "../../components/MessageCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Messages",
  description:
    "Browse sermons, devotionals, and worship content from the Sabbath Vesper Ministry — video, audio, and image messages rooted in Scripture.",
  openGraph: {
    title: "Messages | SAVEMI",
    description:
      "Sermons, devotionals, and music from the Sabbath Vesper Ministry.",
  },
  alternates: { canonical: "/messages" },
};

interface MessagesPageProps {
  searchParams: Promise<{ search?: string; type?: string }>;
}

const messageTypeOptions = [
  { label: "All types", value: "" },
  { label: "Video", value: "video" },
  { label: "Audio", value: "audio" },
  { label: "Image", value: "image" },
] as const;

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const type =
    params.type === "video" || params.type === "audio" || params.type === "image"
      ? params.type
      : undefined;
  const messages = await getMessages({ search: search || undefined, type });
  const hasFilters = Boolean(search || type);

  return (
    <section className="space-y-5">
      <div className="site-panel p-4 sm:p-6">
        <p className="eyebrow text-brand-primary">Messages</p>
        <h1 className="section-title mt-2">Worship Content</h1>
        <p className="section-copy mt-2">
          Sermons, devotionals, and music from the Sabbath Vesper Ministry.
        </p>
      </div>

      <form className="site-panel grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <div>
          <label htmlFor="message-search" className="field-label">
            Search messages
          </label>
          <input
            id="message-search"
            name="search"
            className="field-input"
            placeholder="Title, summary, or speaker"
            defaultValue={search}
          />
        </div>
        <div>
          <label htmlFor="message-type" className="field-label">
            Type
          </label>
          <select
            id="message-type"
            name="type"
            className="field-input"
            defaultValue={type ?? ""}
          >
            {messageTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="button-primary">
            Filter
          </button>
          {hasFilters ? (
            <a href="/messages" className="button-tertiary">
              Clear
            </a>
          ) : null}
        </div>
      </form>

      {messages.length === 0 ? (
        <div className="site-panel p-6 text-center">
          <p className="text-brand-muted text-sm">
            {hasFilters ? "No messages match your filters." : "No published messages yet."}
          </p>
          <p className="text-brand-muted mt-1 text-xs">
            {hasFilters
              ? "Try a broader search or clear the filters."
              : "Configure the database and run the seed step to load content."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {messages.map((msg) => (
            <li key={msg.id}>
              <MessageCard
                id={msg.id}
                slug={msg.slug}
                title={msg.title}
                type={msg.type}
                date={msg.date}
                speaker={msg.speaker}
                summary={msg.summary}
                coverImageUrl={msg.coverImageUrl}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
