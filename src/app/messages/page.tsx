import { getMessages } from "../../lib/messages";
import MessageCard from "../../components/MessageCard";

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const messages = await getMessages();

  return (
    <section className="space-y-4">
      <div className="site-panel p-4 sm:p-6">
        <p className="eyebrow text-brand-primary">Messages</p>
        <h1 className="section-title mt-2">Worship Content</h1>
        <p className="section-copy mt-2">
          Sermons, devotionals, and music from the Sabbath Vesper Ministry.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="site-panel p-6 text-center">
          <p className="text-brand-muted text-sm">No published messages yet.</p>
          <p className="text-brand-muted mt-1 text-xs">
            Configure the database and run the seed step to load content.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
