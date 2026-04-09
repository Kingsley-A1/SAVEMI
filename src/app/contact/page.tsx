import ContactForm from '../../components/ContactForm';

export default function ContactPage() {
  return (
    <section className="space-y-4">
      <div className="site-panel p-4 sm:p-6">
        <p className="eyebrow text-brand-primary">Contact</p>
        <h1 className="section-title mt-2">Reach the ministry</h1>
        <p className="section-copy mt-2">
          Send a message to the SAVEMI team. All submissions are stored securely for ministry
          follow-up.
        </p>
      </div>
      <ContactForm />
    </section>
  );
}
