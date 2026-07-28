"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, Save } from "lucide-react";
import { LoadingButton, InlineLoader } from "../../../../components/ui/Loading";
import type { SiteSettings } from "../../../../lib/site-settings";

interface Field {
  name: keyof SiteSettings;
  label: string;
  placeholder: string;
  hint?: string;
  type?: "text" | "email" | "url" | "tel";
  wide?: boolean;
}

const CONTACT_FIELDS: readonly Field[] = [
  {
    name: "contactEmail",
    label: "Contact email",
    placeholder: "hello@savemionline.org",
    hint: "Shown in the footer and used as the public email handle.",
    type: "email",
  },
  {
    name: "contactPhone",
    label: "Contact phone",
    placeholder: "+234 800 000 0000",
    type: "tel",
  },
  {
    name: "whatsappNumber",
    label: "WhatsApp",
    placeholder: "+234 800 000 0000 or https://wa.me/234…",
    hint: "A bare number is turned into a wa.me link automatically.",
  },
  {
    name: "address",
    label: "Ministry address",
    placeholder: "Calabar, Nigeria",
    wide: true,
  },
];

const SOCIAL_FIELDS: readonly Field[] = [
  {
    name: "facebookUrl",
    label: "Facebook page URL",
    placeholder: "https://www.facebook.com/…",
    type: "url",
  },
  {
    name: "facebookHandle",
    label: "Facebook display name",
    placeholder: "Sabbath Vesper Ministry",
  },
  {
    name: "youtubeUrl",
    label: "YouTube channel URL",
    placeholder: "https://www.youtube.com/@…",
    type: "url",
  },
  {
    name: "youtubeHandle",
    label: "YouTube display name",
    placeholder: "SAVEMI on YouTube",
  },
  {
    name: "instagramUrl",
    label: "Instagram URL",
    placeholder: "https://www.instagram.com/…",
    type: "url",
  },
  {
    name: "instagramHandle",
    label: "Instagram display name",
    placeholder: "@savemi",
  },
  {
    name: "telegramUrl",
    label: "Telegram URL",
    placeholder: "https://t.me/…",
    type: "url",
    wide: true,
  },
];

export default function SiteSettingsForm({
  initialSettings,
}: {
  initialSettings: SiteSettings;
}) {
  const router = useRouter();
  const [form, setForm] = useState<SiteSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dirty = (Object.keys(form) as Array<keyof SiteSettings>).some(
    (key) => form[key] !== initialSettings[key],
  );

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save settings.");
      }

      if (payload.data) setForm(payload.data as SiteSettings);
      setSaved(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "An error occurred.");
    } finally {
      setSaving(false);
    }
  }

  function renderField(field: Field) {
    return (
      <label key={field.name} className={field.wide ? "block sm:col-span-2" : "block"}>
        <span className="field-label">{field.label}</span>
        <input
          name={field.name}
          type={field.type ?? "text"}
          value={form[field.name] ?? ""}
          onChange={handleChange}
          placeholder={field.placeholder}
          disabled={saving}
          className="field-input disabled:opacity-60"
        />
        {field.hint ? (
          <span className="text-brand-muted mt-1 block text-xs leading-5">
            {field.hint}
          </span>
        ) : null}
      </label>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div
          className="rounded p-3 text-sm"
          style={{ background: "rgba(220,38,38,0.07)", color: "#b91c1c" }}
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <fieldset className="site-panel space-y-4 p-5" disabled={saving}>
        <legend className="sr-only">Contact details</legend>
        <h2 className="text-sm font-semibold">Contact Details</h2>
        <p className="text-brand-muted text-xs leading-5">
          These appear in the site footer and the contact page. Leave a field
          blank to hide it from the public site.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {CONTACT_FIELDS.map(renderField)}
        </div>
      </fieldset>

      <fieldset className="site-panel space-y-4 p-5" disabled={saving}>
        <legend className="sr-only">Social handles</legend>
        <h2 className="text-sm font-semibold">Social Handles</h2>
        <p className="text-brand-muted text-xs leading-5">
          Every handle you fill in shows as an icon in the footer and the
          navigation drawer. Empty handles are simply not rendered.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_FIELDS.map(renderField)}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <LoadingButton
          type="submit"
          loading={saving}
          loadingLabel="Saving…"
          icon={<Save size={14} />}
          disabled={!dirty}
        >
          Save settings
        </LoadingButton>

        <button
          type="button"
          onClick={() => {
            setForm(initialSettings);
            setSaved(false);
            setError("");
          }}
          disabled={saving || !dirty}
          className="button-tertiary gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw size={13} />
          Reset
        </button>

        {saving ? <InlineLoader label="Writing to the database…" /> : null}

        {saved && !saving ? (
          <span
            role="status"
            className="inline-flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: "#15803d" }}
          >
            <CheckCircle2 size={14} />
            Settings saved and live on the public site.
          </span>
        ) : null}
      </div>
    </form>
  );
}
