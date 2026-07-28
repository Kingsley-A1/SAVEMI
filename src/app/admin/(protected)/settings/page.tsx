import { getSiteSettings } from "../../../../lib/site-settings";
import SiteSettingsForm from "./SiteSettingsForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Site Settings | SAVEMI Admin",
  description: "Manage ministry contact details and social handles.",
};

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Site Settings</h1>
        <p className="text-brand-muted mt-1 text-sm leading-6">
          Contact details and social handles for the whole public site. Saving
          here updates the footer, the navigation drawer, and the contact page
          immediately — no redeploy needed.
        </p>
      </div>

      <SiteSettingsForm initialSettings={settings} />
    </div>
  );
}
