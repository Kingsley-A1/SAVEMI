/**
 * SAVEMI email templates — clean, Scripture-driven, and always optimistic.
 *
 * Every email carries a verse ("scriptural backing") and a hopeful tone, in
 * keeping with the ministry's voice: Repose, Renewal, Restoration.
 *
 * Templates are plain functions returning HTML strings with fully inlined
 * styles (email clients ignore <style> blocks and external CSS).
 */

import { getSiteUrl } from "./site-url";

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
  rule: "#e4ded0",
};

/** Absolute logo URL — email clients cannot resolve relative paths. */
function getLogoUrl(): string {
  const configured = process.env.EMAIL_LOGO_URL?.trim();
  if (configured && /^https?:\/\//.test(configured)) return configured;

  return `${getSiteUrl()}/images/logo.jpg`;
}

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
  // Buttons are square-cornered to match the rest of the layout.
  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 8px;"><tbody><tr><td style="background:${BRAND.primary};">
         <a href="${escapeHtml(cta.url)}" style="display:inline-block;color:${BRAND.accent};text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.02em;padding:13px 28px;">${escapeHtml(cta.label)}</a>
       </td></tr></tbody></table>`
    : "";

  const logoUrl = getLogoUrl();

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
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.cream};">
    <tr>
      <td align="center" style="padding:0;">
        <!-- Single square container: no rounded corners, no nested cards.
             The message uses the full width the client gives it. -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:0;">
          <!-- Masthead: logo + SAVEMI, stated once -->
          <tr>
            <td style="background:${BRAND.deep};background-image:linear-gradient(135deg,${BRAND.deep} 0%,${BRAND.primary} 100%);padding:26px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:14px;">
                    <!-- Empty alt on purpose: the wordmark beside it already
                         says SAVEMI, so a blocked image must not repeat it. -->
                    <img src="${escapeHtml(logoUrl)}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;border:0;outline:none;text-decoration:none;object-fit:contain;background:#ffffff;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;color:#fff8ea;font-size:23px;font-weight:700;letter-spacing:0.04em;line-height:1.1;">SAVEMI</p>
                    <p style="margin:4px 0 0;color:rgba(241,231,201,0.68);font-size:9px;font-weight:400;letter-spacing:0.1em;text-transform:uppercase;line-height:1.2;">Repose &middot; Renewal &middot; Restoration</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Message -->
          <tr>
            <td style="padding:30px 28px 6px;">
              <h1 style="margin:0 0 16px;color:${BRAND.primary};font-size:21px;font-weight:700;line-height:1.32;">${escapeHtml(heading)}</h1>
              ${bodyHtml}
              ${ctaHtml}
            </td>
          </tr>
          <!-- Scripture: a quiet rule on the page, not a box within a box -->
          <tr>
            <td style="padding:10px 28px 26px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-left:3px solid ${BRAND.primary};padding:2px 0 2px 16px;">
                    <p style="margin:0;color:${BRAND.ink};font-size:15px;font-style:italic;line-height:1.6;">&ldquo;${escapeHtml(scripture.verse)}&rdquo;</p>
                    <p style="margin:8px 0 0;color:${BRAND.primary};font-size:13px;font-weight:600;">&mdash; ${escapeHtml(scripture.reference)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:18px 28px 26px;border-top:1px solid ${BRAND.rule};">
              <p style="margin:0;color:${BRAND.soft};font-size:12px;line-height:1.65;">
                Sabbath Vesper Ministry &middot; Calabar, Nigeria<br />
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

/**
 * Greet with the first name only. Recipients get their name once, in the
 * heading — never repeated again in the body or the masthead.
 */
function greetingName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0];
  return first || "friend";
}

/** Admin email verification on registration. */
export function renderVerificationEmail(params: {
  name: string;
  verifyUrl: string;
}): RenderedEmail {
  const heading = `Welcome aboard, ${greetingName(params.name)}`;
  const bodyHtml = paragraphsToHtml(
    `You have been added to the ministry's admin team. We are glad to serve alongside you.

Please confirm this is your email address using the button below. It keeps the admin office secure and readies your account for good work.

If you did not request this, you can safely ignore this message.`,
  );

  return {
    subject: "Confirm your admin email",
    html: renderLayout({
      preheader: "Confirm your email to activate your admin account.",
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
  const heading = `Your admin account is ready, ${greetingName(params.name)}`;
  const bodyHtml = paragraphsToHtml(
    `Thank you for lending your time and gifts to the work of Repose, Renewal, and Restoration.

From the admin office you can publish messages, curate books and quotes, respond to those who reach out, and share encouragement. May every task be done as unto the Lord.

Sign in whenever you are ready — we are expecting good things.`,
  );

  return {
    subject: "Your admin account is ready",
    html: renderLayout({
      preheader: "Your admin account is ready. Welcome!",
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
