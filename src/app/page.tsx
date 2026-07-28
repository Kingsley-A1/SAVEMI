import { Moon, Sunrise, Heart, ArrowRight, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getMessages } from "../lib/messages";
import HomeAnimationWrapper from "../components/HomeAnimationWrapper";
import FeaturedVideos from "../components/FeaturedVideos";
import FeaturedAudios from "../components/FeaturedAudios";
import SocialLinks from "../components/SocialLinks";
import { FacebookIcon } from "../components/SocialIcons";

export const dynamic = "force-dynamic";

/* ── Scripture-backed pillars: Repose · Renewal · Restoration ── */
const pillars = [
  {
    label: "Repose",
    icon: Moon,
    heading: '"He maketh me to lie down in green pastures"',
    verse: "Psalm 23:2",
    body: "The seventh-day Sabbath is holy rest — an invitation to be still beside quiet waters and repose in the presence of God.",
  },
  {
    label: "Renewal",
    icon: Sunrise,
    heading: '"They that wait upon the LORD shall renew their strength"',
    verse: "Isaiah 40:31",
    body: "Reflection at Eventide renews the weary spirit, lifting hearts to mount up with wings as eagles for the days ahead.",
  },
  {
    label: "Restoration",
    icon: Heart,
    heading: '"He restoreth my soul"',
    verse: "Psalm 23:3",
    body: "Sabbath rest restores the soul, leading weary hearts back to Christ, the Lord of the Sabbath and giver of life.",
  },
];

export default async function HomePage() {
  const [featuredVideos, featuredAudios] = await Promise.all([
    getMessages({ type: "video", limit: 8 }),
    getMessages({ type: "audio", limit: 6 }),
  ]);

  return (
    <HomeAnimationWrapper>
      {/* 1. Ministry hero — still water, green pastures, room to breathe */}
      <section
        className="reflection-hero full-bleed"
        aria-labelledby="home-hero-title"
      >
        <div className="reflection-hero__media">
          <Image
            src="/images/hero-nature.jpg"
            alt=""
            fill
            priority
            quality={90}
            sizes="100vw"
            className="reflection-hero__photo"
          />
        </div>
        <div className="reflection-hero__scrim" aria-hidden="true" />

        <div className="reflection-hero__inner">
          <p className="eyebrow reflection-hero__eyebrow">
            Sabbath Vesper Ministry
          </p>
          <h1 id="home-hero-title" className="reflection-hero__title">
            Be still, and know that He is God
          </h1>
          <p className="reflection-hero__copy">
            Welcome to SAVEMI, a media ministry that explores the significance
            of the seventh-day Sabbath from different biblical perspectives —
            calling weary hearts to a divine rest, reflection, renewal, and
            restoration.
          </p>

          <div className="reflection-hero__actions">
            <Link href="/videos" className="hero-btn-primary">
              Watch messages
            </Link>
            <Link href="/about" className="hero-btn-secondary">
              Our story
            </Link>
          </div>

          <blockquote
            className="reflection-hero__scripture"
            aria-label="Scripture foundation"
          >
            <p className="reflection-hero__verse">
              &ldquo;Come to Me, all you who labor and are heavy laden, and I
              will give you rest.&rdquo;
            </p>
            <cite className="reflection-hero__reference not-italic">
              Matthew 11:28 NKJV
            </cite>
          </blockquote>

          <p className="reflection-hero__cue" aria-hidden="true">
            <ChevronDown size={14} />
            Scroll
          </p>
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
        <div className="mb-5 flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(24,119,242,0.1)" }}
          >
            <FacebookIcon size={24} title="Facebook" />
          </span>
          <div>
            <p className="eyebrow text-brand-primary">Primary Platform</p>
            <h2 className="section-title mt-1">Follow SAVEMI on Facebook</h2>
          </div>
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
          <div className="mt-6 flex justify-center">
            <SocialLinks variant="icons" />
          </div>
        </div>
      </section>
    </HomeAnimationWrapper>
  );
}
