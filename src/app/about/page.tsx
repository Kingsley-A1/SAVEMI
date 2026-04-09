export default function AboutPage() {
  return (
    <section className="space-y-4">
      <div className="site-panel p-4 sm:p-6">
        <p className="eyebrow text-brand-primary">About SAVEMI</p>
        <h1 className="section-title mt-2">
          A ministry shaped for the close of day
        </h1>
        <p className="section-copy mt-2">
          SAVEMI — the Sabbath Vesper Ministry — was formed to create space for
          calm reflection and worship at eventide. Through sermons, music, and
          devotional meditations it draws believers toward Sabbath rest.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="site-panel p-4 sm:p-5">
          <h2 className="eyebrow text-brand-primary">Mission</h2>
          <p className="text-brand-muted mt-2 text-sm leading-6">
            Present reflective worship resources that are easy to access,
            mobile-friendly, and visually calm — so the ministry message stays
            central.
          </p>
        </article>
        <article className="site-panel p-4 sm:p-5">
          <h2 className="eyebrow text-brand-primary">Presence</h2>
          <p className="text-brand-muted mt-2 text-sm leading-6">
            This website extends the ministry online so sermons, devotionals,
            and music can be reached wherever the day ends.
          </p>
        </article>
        <article className="site-panel p-4 sm:p-5">
          <h2 className="eyebrow text-brand-primary">Content</h2>
          <p className="text-brand-muted mt-2 text-sm leading-6">
            Messages are published as video, audio, or image — each formatted to
            suit the platform and the pace of end-of-day worship.
          </p>
        </article>
        <article className="site-panel p-4 sm:p-5">
          <h2 className="eyebrow text-brand-primary">Community</h2>
          <p className="text-brand-muted mt-2 text-sm leading-6">
            The ministry welcomes questions and connections. Use the Contact
            page to reach the SAVEMI team directly.
          </p>
        </article>
      </div>
    </section>
  );
}
