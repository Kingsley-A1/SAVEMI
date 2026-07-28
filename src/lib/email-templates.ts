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
  /** A 6-digit code shown large and spaced, for the recipient to type. */
  code?: string;
  /** Quieter copy placed after the code or CTA, e.g. "if this wasn't you". */
  trailingHtml?: string;
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
  code,
  trailingHtml,
}: LayoutOptions): string {
  // The code is the action in a code-based email, so it is set large, spaced,
  // and monospaced — easy to read off a phone and retype without error.
  const codeHtml = code
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 18px;"><tbody><tr><td style="background:#f4f1e6;border:1px solid ${BRAND.rule};padding:16px 26px;">
         <p style="margin:0;color:${BRAND.primary};font-size:31px;font-weight:700;letter-spacing:0.22em;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;line-height:1.1;">${escapeHtml(code)}</p>
       </td></tr></tbody></table>`
    : "";
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
              ${codeHtml}
              ${ctaHtml}
              ${trailingHtml ?? ""}
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

/** Admin email verification on registration — 6-digit code. */
export function renderVerificationEmail(params: {
  name: string;
  code: string;
  minutes: number;
}): RenderedEmail {
  const heading = `Welcome aboard, ${greetingName(params.name)}`;
  const bodyHtml = paragraphsToHtml(
    `You have been added to the ministry's admin team. We are glad to serve alongside you.

Enter this confirmation code on the verification page to activate your admin account. It expires in ${params.minutes} minutes.`,
  );

  const footerHtml = paragraphsToHtml(
    `If you did not request this, you can safely ignore this message and the code will simply expire.`,
  );

  return {
    subject: `Your SAVEMI confirmation code: ${params.code}`,
    html: renderLayout({
      preheader: `Your admin confirmation code is ${params.code}.`,
      heading,
      bodyHtml,
      code: params.code,
      // Reassurance sits after the code so the action is never buried.
      trailingHtml: footerHtml,
      scripture: {
        verse:
          "Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ.",
        reference: "Philippians 1:6",
      },
    }),
  };
}

/** Password reset for a public member — 6-digit code. */
export function renderPasswordResetEmail(params: {
  name: string;
  code: string;
  minutes: number;
}): RenderedEmail {
  const heading = `Reset your password, ${greetingName(params.name)}`;
  const bodyHtml = paragraphsToHtml(
    `We received a request to reset the password on your SAVEMI account.

Enter this code on the reset page to choose a new password. It expires in ${params.minutes} minutes.`,
  );

  const footerHtml = paragraphsToHtml(
    `If you did not ask for this, no action is needed — your password stays as it is and the code will expire on its own.`,
  );

  return {
    subject: `Your SAVEMI password reset code: ${params.code}`,
    html: renderLayout({
      preheader: `Your password reset code is ${params.code}.`,
      heading,
      bodyHtml,
      code: params.code,
      trailingHtml: footerHtml,
      scripture: {
        verse:
          "The LORD is my strength and my shield; my heart trusted in him, and I am helped.",
        reference: "Psalm 28:7",
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

/** Welcome email for a member of the public who registered on the site. */
export function renderMemberWelcomeEmail(params: {
  name: string;
  siteUrl: string;
}): RenderedEmail {
  const heading = `Welcome to SAVEMI, ${greetingName(params.name)}`;
  const bodyHtml = paragraphsToHtml(
    `We are glad you have joined the SAVEMI family. Your account is ready.

You can now keep up with Sabbath messages, reflections, and resources as they are shared, and reach the ministry whenever you need prayer or encouragement.

May every visit bring you repose, renewal, and restoration.`,
  );

  return {
    subject: "Welcome to SAVEMI",
    html: renderLayout({
      preheader: "Your SAVEMI account is ready.",
      heading,
      bodyHtml,
      cta: { label: "Visit SAVEMI", url: params.siteUrl },
      scripture: {
        verse:
          "Come to Me, all you who labor and are heavy laden, and I will give you rest.",
        reference: "Matthew 11:28 NKJV",
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
