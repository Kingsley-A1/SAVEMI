import { BookOpen } from "lucide-react";

export default function AboutPage() {
  return (
    <section className="space-y-4">
      <div className="site-panel p-4 sm:p-6">
        <p className="eyebrow text-brand-primary">About SAVEMI</p>
        <h1 className="section-title mt-2">
          A seventh-day Sabbath ministry of reflection and biblical study
        </h1>
        <p className="section-copy mt-2">
          SAVEMI, the Sabbath Vesper Ministry, is based in Calabar, Nigeria,
          committed to exploring the significance of the seventh-day Sabbath
          from different biblical perspectives. Its work emphasizes biblical
          meditation on and spiritual reflection about God&apos;s holy day of
          rest, and a clearer understanding of Heaven&apos;s grand plan for
          restless humanity.
        </p>
      </div>

      {/* The mission is the ministry's charge, so it is set apart from the
          reference cards below: full width, deep green, and given room. */}
      <article className="mission-card">
        <p className="eyebrow mission-card__eyebrow">Our Mission</p>
        <p className="mission-card__statement">
          Present a more nuanced, biblically grounded teaching on the
          significance of the seventh-day Sabbath, along with Reflections at
          Eventide and other resources that help believers remember, delight
          in, and cherish the invitation to rest in the presence of God.
        </p>
        <p className="mission-card__seal">
          <BookOpen size={13} aria-hidden="true" />
          Repose · Renewal · Restoration
        </p>
      </article>

      <div className="grid gap-3 sm:grid-cols-2">
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
            seventh-day Sabbath teachings, short devotional clips, and messages
            on faith, healing, and spiritual restoration.
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
