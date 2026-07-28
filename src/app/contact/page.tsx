import { Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "../../components/ContactForm";
import SocialLinks from "../../components/SocialLinks";
import { getSiteSettings, toSocialLinks } from "../../lib/site-settings";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  // Contact details and handles come from Admin → Site Settings, so the
  // ministry can change them without a redeploy.
  const settings = await getSiteSettings();
  const socialLinks = toSocialLinks(settings);

  const details = [
    settings.address
      ? { icon: MapPin, label: "Address", value: settings.address, href: null }
      : null,
    settings.contactEmail
      ? {
          icon: Mail,
          label: "Email",
          value: settings.contactEmail,
          href: `mailto:${settings.contactEmail}`,
        }
      : null,
    settings.contactPhone
      ? {
          icon: Phone,
          label: "Phone",
          value: settings.contactPhone,
          href: `tel:${settings.contactPhone.replace(/\s+/g, "")}`,
        }
      : null,
  ].filter((detail) => detail !== null);

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

        {details.length > 0 ? (
          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            {details.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded"
                  style={{ background: "rgba(10,79,60,0.07)" }}
                >
                  <Icon
                    size={15}
                    style={{ color: "var(--brand-primary)" }}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  <dt className="text-brand-muted text-xs font-medium">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium">
                    {href ? (
                      <a
                        href={href}
                        className="hover:text-brand-primary transition-colors"
                      >
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {socialLinks.length > 0 ? (
        <div className="site-panel p-4 sm:p-6">
          <p className="eyebrow text-brand-primary">Connect with us</p>
          <h2 className="mt-1 text-lg font-semibold">
            Follow SAVEMI on your favourite platform
          </h2>
          <p className="text-brand-muted mt-1 text-sm">
            Reach the ministry wherever you already are — we&apos;d love to hear
            from you.
          </p>
          <SocialLinks links={socialLinks} variant="cards" className="mt-4" />
        </div>
      ) : null}

      <ContactForm />
    </section>
  );
}
