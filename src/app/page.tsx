import { Moon, Sunrise, Heart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getMessages } from "../lib/messages";
import HomeAnimationWrapper from "../components/HomeAnimationWrapper";
import FeaturedVideos from "../components/FeaturedVideos";
import FeaturedAudios from "../components/FeaturedAudios";

export const dynamic = "force-dynamic";

/* ── Scripture-backed pillars ───────────────────────────────── */
const pillars = [
  {
    label: "Remembrance",
    icon: Moon,
    heading: '"Remember the sabbath day, to keep it holy"',
    verse: "Exodus 20:8",
    body: "A Seventh-day Sabbath witness shaped by Scripture, worship, and holy time with God.",
  },
  {
    label: "Delight",
    icon: Sunrise,
    heading: '"Call the sabbath a delight"',
    verse: "Isaiah 58:13",
    body: "Reflection at Eventide helps believers enter the Sabbath with reverence, gratitude, and joy.",
  },
  {
    label: "Restoration",
    icon: Heart,
    heading: '"The sabbath was made for man"',
    verse: "Mark 2:27",
    body: "Sabbath rest points weary hearts back to Christ, the Lord of the Sabbath and giver of life.",
  },
];

export default async function HomePage() {
  const [featuredVideos, featuredAudios] = await Promise.all([
    getMessages({ type: "video", limit: 8 }),
    getMessages({ type: "audio", limit: 6 }),
  ]);

  return (
    <HomeAnimationWrapper>
      {/* 1. Fixed ministry hero */}
      <section className="reflection-hero" aria-labelledby="home-hero-title">
        <div className="reflection-hero__content">
          <p className="eyebrow reflection-hero__eyebrow">
            Sabbath Vesper Ministry
          </p>
          <h1 id="home-hero-title" className="reflection-hero__title">
            Seventh-day Sabbath reflection rooted in Scripture
          </h1>
          <p className="reflection-hero__copy">
            Sabbath Vesper Ministry (SAVEMI), based in Calabar, Nigeria,
            studies the Seventh-day Sabbath from biblical perspectives and
            calls believers into meditation, spiritual reflection, and a deeper
            understanding of God&apos;s grand plan.
          </p>
          <div className="reflection-hero__actions">
            <Link href="/videos" className="hero-btn-primary">
              Watch messages
            </Link>
            <Link href="/about" className="hero-btn-secondary">
              Our story
            </Link>
          </div>
        </div>

        <div className="reflection-hero__scripture" aria-label="Scripture foundation">
          <p className="eyebrow reflection-hero__eyebrow">Remember</p>
          <p className="reflection-hero__verse">
            &quot;Remember the sabbath day, to keep it holy&quot;
          </p>
          <p className="reflection-hero__reference">Exodus 20:8</p>
        </div>
      </section>

      {/* 2. Scripture pillars */}
      <section className="site-container">
        <div className="mb-6 text-center">
          <p className="eyebrow text-brand-primary">Our Foundation</p>
          <h2 className="section-title mt-2">Rooted in the Word</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {pillars.map(({ label, icon: Icon, heading, verse, body }) => (
            <article key={label} className="site-panel p-5">
              <div
                className="mb-3 flex h-9 w-9 items-center justify-center rounded"
                style={{ background: "rgba(10,79,60,0.08)" }}
              >
                <Icon size={20} style={{ color: "var(--brand-primary)" }} />
              </div>
              <p className="eyebrow text-brand-primary">{label}</p>
              <h3 className="mt-2 text-sm font-semibold italic leading-snug">
                {heading}
              </h3>
              <p
                className="mt-1 text-xs font-medium"
                style={{ color: "var(--brand-primary-soft)" }}
              >
                — {verse}
              </p>
              <p className="text-brand-muted mt-3 text-xs leading-5">
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* 4. Featured videos */}
      <section className="site-container">
        <FeaturedVideos items={featuredVideos} />
      </section>

      {/* 5. Facebook feed */}
      <section className="site-container">
        <div className="mb-5">
          <p className="eyebrow text-brand-primary">Primary Platform</p>
          <h2 className="section-title mt-1">Follow SAVEMI on Facebook</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="site-panel p-5">
            <p className="eyebrow text-brand-primary">Official Page</p>
            <h3 className="mt-2 text-lg font-semibold">
              Sabbath Vesper Ministry
            </h3>
            <p className="text-brand-muted mt-3 text-sm leading-6">
              Facebook is the ministry&apos;s main public hub for community
              updates, devotional posts, and Reflection at Eventide content.
            </p>
            <a
              href="https://www.facebook.com/people/Sabbath-Vesper-Ministry/61586401769698/"
              target="_blank"
              rel="noopener noreferrer"
              className="button-tertiary mt-4 inline-flex items-center gap-1.5"
            >
              Visit Facebook page
              <ArrowRight size={14} />
            </a>
          </article>
          <article className="site-panel p-5">
            <p className="eyebrow text-brand-primary">Video Archive</p>
            <h3 className="mt-2 text-lg font-semibold">
              Reflection at Eventide and sermon videos
            </h3>
            <p className="text-brand-muted mt-3 text-sm leading-6">
              Browse SAVEMI&apos;s published video archive for recent worship
              themes, spiritual encouragement, and Sabbath reflections.
            </p>
            <a
              href="https://www.facebook.com/61586401769698/videos/"
              target="_blank"
              rel="noopener noreferrer"
              className="button-tertiary mt-4 inline-flex items-center gap-1.5"
            >
              Open video archive
              <ArrowRight size={14} />
            </a>
          </article>
        </div>
      </section>

      {/* 6. Featured audios */}
      <section className="site-container">
        <FeaturedAudios items={featuredAudios} />
      </section>

      {/* 7. CTA strip */}
      <section className="site-container pb-12">
        <div
          className="rounded-lg px-6 py-10 text-center sm:px-10"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-primary-deep) 0%, var(--brand-primary) 100%)",
          }}
        >
          <p className="eyebrow" style={{ color: "rgba(241,231,201,0.65)" }}>
            Stay Connected
          </p>
          <h2
            className="mt-3 text-2xl font-semibold sm:text-3xl"
            style={{ color: "#fff8ea" }}
          >
            Join the vesper community
          </h2>
          <p
            className="mx-auto mt-3 max-w-md text-sm leading-6"
            style={{ color: "rgba(241,231,201,0.72)" }}
          >
            Reach out with a prayer request, testimony, or Sabbath question.
            The ministry door is always open.
          </p>
          <Link href="/contact" className="hero-btn-primary mt-6 inline-flex">
            Send a message
          </Link>
        </div>
      </section>
    </HomeAnimationWrapper>
  );
}
