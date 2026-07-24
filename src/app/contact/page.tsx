import ContactForm from "../../components/ContactForm";
import SocialLinks from "../../components/SocialLinks";
import { hasSocialLinks } from "../../lib/social";

export default function ContactPage() {
  const showSocials = hasSocialLinks();

  return (
    <section className="space-y-4">
      <div className="site-panel p-4 sm:p-6">
        <p className="eyebrow text-brand-primary">Contact</p>
        <h1 className="section-title mt-2">Reach the ministry</h1>
        <p className="section-copy mt-2">
          Send a message to the SAVEMI team. All submissions are stored securely
          for ministry follow-up. Share prayer requests, testimonies, Sabbath
          questions, or website support needs, and include the best email for a
          reply.
        </p>
      </div>

      {showSocials ? (
        <div className="site-panel p-4 sm:p-6">
          <p className="eyebrow text-brand-primary">Connect with us</p>
          <h2 className="mt-1 text-lg font-semibold">
            Follow SAVEMI on your favourite platform
          </h2>
          <p className="text-brand-muted mt-1 text-sm">
            Reach the ministry on Facebook, YouTube, and WhatsApp, or send an
            email — we&apos;d love to hear from you.
          </p>
          <SocialLinks variant="cards" className="mt-4" />
        </div>
      ) : null}

      <ContactForm />
    </section>
  );
}
