/**
 * SAVEMI email templates — clean, Scripture-driven, and always optimistic.
 *
 * Every email carries a verse ("scriptural backing") and a hopeful tone, in
 * keeping with the ministry's voice: Repose, Renewal, Restoration.
 *
 * Templates are plain functions returning HTML strings with fully inlined
 * styles (email clients ignore <style> blocks and external CSS).
 */

export interface Scripture {
  verse: string;
  reference: string;
}

interface LayoutOptions {
  /** Preheader shown in inbox preview. */
  preheader: string;
  heading: string;
  /** Inner body HTML (paragraphs already wrapped). */
  bodyHtml: string;
  scripture: Scripture;
  cta?: { label: string; url: string };
}

const BRAND = {
  deep: "#083b2d",
  primary: "#0a4f3c",
  accent: "#f1e7c9",
  cream: "#fbf8ef",
  ink: "#1f2a26",
  soft: "#5a7268",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Turn a plain-text block (with blank-line paragraphs) into safe HTML. */
export function paragraphsToHtml(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map(
      (para) =>
        `<p style="margin:0 0 16px;color:${BRAND.ink};font-size:15px;line-height:1.65;">${escapeHtml(
          para,
        ).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

function renderLayout({
  preheader,
  heading,
  bodyHtml,
  scripture,
  cta,
}: LayoutOptions): string {
  const ctaHtml = cta
    ? `<tr><td style="padding:8px 0 4px;">
         <a href="${escapeHtml(cta.url)}" style="display:inline-block;background:${BRAND.primary};color:${BRAND.accent};text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.02em;padding:12px 26px;border-radius:6px;">${escapeHtml(cta.label)}</a>
       </td></tr>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid rgba(10,79,60,0.12);border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.deep} 0%,${BRAND.primary} 100%);padding:28px 32px;">
              <p style="margin:0;color:rgba(241,231,201,0.7);font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Sabbath Vesper Ministry</p>
              <p style="margin:6px 0 0;color:#fff8ea;font-size:22px;font-weight:700;letter-spacing:0.02em;">SAVEMI</p>
              <p style="margin:4px 0 0;color:rgba(241,231,201,0.72);font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;">Repose &middot; Renewal &middot; Restoration</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0 0 18px;color:${BRAND.primary};font-size:20px;font-weight:700;line-height:1.35;">${escapeHtml(heading)}</h1>
              ${bodyHtml}
              <table role="presentation" cellpadding="0" cellspacing="0"><tr><td>${ctaHtml ? `<table role="presentation" cellpadding="0" cellspacing="0"><tbody>${ctaHtml}</tbody></table>` : ""}</td></tr></table>
            </td>
          </tr>
          <!-- Scripture -->
          <tr>
            <td style="padding:12px 32px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(10,79,60,0.05);border-left:3px solid ${BRAND.primary};border-radius:6px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:${BRAND.ink};font-size:15px;font-style:italic;line-height:1.6;">&ldquo;${escapeHtml(scripture.verse)}&rdquo;</p>
                    <p style="margin:8px 0 0;color:${BRAND.primary};font-size:13px;font-weight:600;">&mdash; ${escapeHtml(scripture.reference)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid rgba(10,79,60,0.1);">
              <p style="margin:0;color:${BRAND.soft};font-size:12px;line-height:1.6;">
                Sabbath Vesper Ministry (SAVEMI) &middot; Calabar, Nigeria<br />
                Grace and peace be with you.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

/** Admin email verification on registration. */
export function renderVerificationEmail(params: {
  name: string;
  verifyUrl: string;
}): RenderedEmail {
  const heading = `Welcome aboard, ${params.name} — let's confirm your email`;
  const bodyHtml = paragraphsToHtml(
    `You have been added to the SAVEMI admin team. We're glad to serve alongside you.

Please confirm this is your email address by clicking the button below. This keeps the ministry's admin office secure and your account ready for good work.

If you did not request this, you can safely ignore this message.`,
  );

  return {
    subject: "Confirm your SAVEMI admin email",
    html: renderLayout({
      preheader: "Confirm your email to activate your SAVEMI admin account.",
      heading,
      bodyHtml,
      cta: { label: "Confirm my email", url: params.verifyUrl },
      scripture: {
        verse:
          "Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ.",
        reference: "Philippians 1:6",
      },
    }),
  };
}

/** Welcome email after an admin verifies (or when verification is skipped). */
export function renderWelcomeEmail(params: {
  name: string;
  loginUrl: string;
}): RenderedEmail {
  const heading = `Welcome to the SAVEMI admin office, ${params.name}`;
  const bodyHtml = paragraphsToHtml(
    `Your admin account is ready. Thank you for lending your time and gifts to the ministry's work of Repose, Renewal, and Restoration.

From the admin office you can publish messages, curate books and quotes, respond to those who reach out, and share encouragement. May every task be done as unto the Lord.

Sign in whenever you're ready — we're expecting good things.`,
  );

  return {
    subject: "Your SAVEMI admin account is ready",
    html: renderLayout({
      preheader: "Your SAVEMI admin account is ready. Welcome!",
      heading,
      bodyHtml,
      cta: { label: "Go to the admin office", url: params.loginUrl },
      scripture: {
        verse:
          "And whatsoever ye do, do it heartily, as to the Lord, and not unto men.",
        reference: "Colossians 3:23",
      },
    }),
  };
}

/**
 * An email composed by an admin and sent through the ministry template.
 * The admin may supply their own Scripture; a hopeful default is used otherwise.
 */
export function renderAdminComposedEmail(params: {
  heading: string;
  bodyText: string;
  scripture?: Scripture;
  cta?: { label: string; url: string };
}): RenderedEmail {
  const scripture: Scripture =
    params.scripture && params.scripture.verse.trim() && params.scripture.reference.trim()
      ? params.scripture
      : {
          verse:
            "The LORD bless thee, and keep thee: the LORD make his face shine upon thee, and be gracious unto thee.",
          reference: "Numbers 6:24-25",
        };

  return {
    subject: params.heading,
    html: renderLayout({
      preheader: params.heading,
      heading: params.heading,
      bodyHtml: paragraphsToHtml(params.bodyText),
      cta: params.cta,
      scripture,
    }),
  };
}
