export default function AboutPage() {
  return (
    <section className="space-y-4">
      <div className="site-panel p-4 sm:p-6">
        <p className="eyebrow text-brand-primary">About SAVEMI</p>
        <h1 className="section-title mt-2">
          A Sabbath-centered ministry of reflection and biblical study
        </h1>
        <p className="section-copy mt-2">
          SAVEMI, the Sabbath Vesper Ministry, is a ministry based in Calabar,
          Nigeria, committed to exploring the seventh-day Sabbath from biblical
          perspectives. Its work emphasizes meditation, spiritual reflection,
          and clearer understanding of God&apos;s grand plan for humanity.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="site-panel p-4 sm:p-5">
          <h2 className="eyebrow text-brand-primary">Mission</h2>
          <p className="text-brand-muted mt-2 text-sm leading-6">
            Present biblically grounded Sabbath teachings and Reflection at
            Eventide resources that help believers rest, reflect, and recover
            in the presence of God.
          </p>
        </article>
        <article className="site-panel p-4 sm:p-5">
          <h2 className="eyebrow text-brand-primary">Anchor</h2>
          <p className="text-brand-muted mt-2 text-sm leading-6">
            Pastor Odor Victor T. is the ministry anchor, guiding SAVEMI&apos;s
            teaching voice and public reflection themes.
          </p>
        </article>
        <article className="site-panel p-4 sm:p-5">
          <h2 className="eyebrow text-brand-primary">Headquarters</h2>
          <p className="text-brand-muted mt-2 text-sm leading-6">
            101 Goldie Street, Calabar, Nigeria.
          </p>
        </article>
        <article className="site-panel p-4 sm:p-5">
          <h2 className="eyebrow text-brand-primary">Primary Platform</h2>
          <p className="text-brand-muted mt-2 text-sm leading-6">
            SAVEMI&apos;s main community and media hub is Facebook, where the
            ministry publishes devotional videos, sermons, and archive content.
          </p>
          <a
            href="https://www.facebook.com/people/Sabbath-Vesper-Ministry/61586401769698/"
            target="_blank"
            rel="noopener noreferrer"
            className="button-tertiary mt-4 inline-flex"
          >
            Open Facebook page
          </a>
        </article>
        <article className="site-panel p-4 sm:p-5">
          <h2 className="eyebrow text-brand-primary">Themes</h2>
          <p className="text-brand-muted mt-2 text-sm leading-6">
            The ministry&apos;s recurring content includes Reflection at Eventide,
            Sabbath teachings, short motivational clips, and messages on faith,
            healing, and spiritual restoration.
          </p>
        </article>
        <article className="site-panel p-4 sm:p-5">
          <h2 className="eyebrow text-brand-primary">Hashtags</h2>
          <p className="text-brand-muted mt-2 text-sm leading-6">
            #savemi, #sabbathvesperministry, and #ReflectionAtEventide.
          </p>
        </article>
      </div>
    </section>
  );
}
