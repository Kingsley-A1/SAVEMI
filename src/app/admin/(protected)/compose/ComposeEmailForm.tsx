"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Send, CheckCircle2 } from "lucide-react";
import { LoadingButton } from "../../../../components/ui/Loading";

interface ComposeEmailFormProps {
  emailReady: boolean;
}

interface SendResponse {
  error?: string;
  message?: string;
  data?: { sent: number; failed: number; failedRecipients: string[] };
}

export default function ComposeEmailForm({ emailReady }: ComposeEmailFormProps) {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [scriptureVerse, setScriptureVerse] = useState("");
  const [scriptureReference, setScriptureReference] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSending(true);

    try {
      const response = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          body: bodyText,
          scriptureVerse,
          scriptureReference,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | SendResponse
        | null;

      if (!response.ok) {
        setError(payload?.error ?? "The message could not be sent.");
        return;
      }

      setSuccess(payload?.message ?? "Message sent.");
      setTo("");
      setSubject("");
      setBodyText("");
      setScriptureVerse("");
      setScriptureReference("");
      router.refresh();
    } catch {
      setError("The request failed. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={handleSubmit} className="site-panel space-y-4 p-5 sm:p-6">
        <div>
          <label htmlFor="to" className="field-label">
            Recipients
          </label>
          <input
            id="to"
            type="text"
            className="field-input"
            placeholder="one@example.com, two@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={sending || !emailReady}
            required
          />
          <p className="text-brand-muted mt-1 text-xs">
            Separate multiple addresses with commas. Recipients don&apos;t see
            each other.
          </p>
        </div>

        <div>
          <label htmlFor="subject" className="field-label">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            className="field-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={sending || !emailReady}
            required
          />
        </div>

        <div>
          <label htmlFor="body" className="field-label">
            Message
          </label>
          <textarea
            id="body"
            className="field-input min-h-40"
            placeholder="Write your message. Separate paragraphs with a blank line."
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            disabled={sending || !emailReady}
            required
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="verse" className="field-label">
              Scripture (optional)
            </label>
            <input
              id="verse"
              type="text"
              className="field-input"
              placeholder="The LORD is my shepherd; I shall not want."
              value={scriptureVerse}
              onChange={(e) => setScriptureVerse(e.target.value)}
              disabled={sending || !emailReady}
            />
          </div>
          <div>
            <label htmlFor="ref" className="field-label">
              Reference
            </label>
            <input
              id="ref"
              type="text"
              className="field-input sm:w-36"
              placeholder="Psalm 23:1"
              value={scriptureReference}
              onChange={(e) => setScriptureReference(e.target.value)}
              disabled={sending || !emailReady}
            />
          </div>
        </div>
        <p className="text-brand-muted text-xs">
          Leave Scripture blank to use a hopeful default blessing.
        </p>

        {error ? (
          <p
            role="alert"
            className="rounded px-3 py-2 text-xs"
            style={{
              background: "var(--state-attention-surface)",
              color: "var(--state-attention)",
              border: "1px solid var(--state-attention-border)",
            }}
          >
            {error}
          </p>
        ) : null}

        {success ? (
          <p
            className="flex items-center gap-2 rounded px-3 py-2 text-xs"
            style={{
              background: "rgba(22,163,74,0.08)",
              color: "#15803d",
              border: "1px solid rgba(22,163,74,0.18)",
            }}
          >
            <CheckCircle2 size={14} />
            {success}
          </p>
        ) : null}

        <LoadingButton
          type="submit"
          className="button-primary w-full"
          loading={sending}
          loadingLabel="Sending…"
          icon={<Send size={15} />}
          disabled={!emailReady}
        >
          Send email
        </LoadingButton>
      </form>

      {/* Live preview — mirrors the delivered template exactly: logo masthead,
          square corners, one container, no box inside a box. */}
      <div className="space-y-2">
        <p className="field-label">Preview</p>
        <div
          className="overflow-hidden border"
          style={{ borderColor: "rgba(10,79,60,0.15)", background: "#fff" }}
        >
          <div
            className="flex items-center gap-3.5 px-7 py-6"
            style={{
              background: "linear-gradient(135deg,#083b2d 0%,#0a4f3c 100%)",
            }}
          >
            <Image
              src="/images/logo.jpg"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 bg-white object-contain"
            />
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight tracking-[0.04em] text-[#fff8ea]">
                SAVEMI
              </p>
              <p className="mt-1 text-[9px] font-normal uppercase tracking-[0.1em] text-[rgba(241,231,201,0.68)]">
                Repose · Renewal · Restoration
              </p>
            </div>
          </div>

          <div className="px-7 py-6">
            <h2 className="text-base font-bold text-brand-primary">
              {subject || "Your subject line"}
            </h2>
            <div className="mt-3 space-y-3">
              {(bodyText || "Your message will appear here.")
                .split(/\n{2,}/)
                .map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed text-[#1f2a26]">
                    {para}
                  </p>
                ))}
            </div>
            <div
              className="mt-5 border-l-[3px] py-0.5 pl-4"
              style={{ borderColor: "#0a4f3c" }}
            >
              <p className="text-sm italic leading-relaxed text-[#1f2a26]">
                &ldquo;
                {scriptureVerse ||
                  "The LORD bless thee, and keep thee: the LORD make his face shine upon thee, and be gracious unto thee."}
                &rdquo;
              </p>
              <p className="mt-2 text-xs font-semibold text-brand-primary">
                — {scriptureReference || "Numbers 6:24-25"}
              </p>
            </div>
          </div>

          <div
            className="border-t px-7 py-5"
            style={{ borderColor: "#e4ded0" }}
          >
            <p className="text-xs leading-relaxed text-[#5a7268]">
              Sabbath Vesper Ministry · Calabar, Nigeria
              <br />
              Grace and peace be with you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
