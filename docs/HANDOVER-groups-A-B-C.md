# SAVEMI — Handover Notes (Groups A, B, C)

This document covers the work delivered in the cleanup phase:

- **Group A** — Multi-admin registration + the register→login redirect fix
- **Group B** — Resend email system (verification, welcome, admin compose)
- **Group C** — Ultra-resilient uploads (multipart + retry) + cover preview

Everything is code-complete. The sections below list **exactly what you must do
yourself** (environment, Cloudflare, database) to make it live.

---

## ✅ What changed in the code

### Group A — Registration
- New env var **`ADMIN_ALLOWED_EMAILS`** (comma-separated). Anyone on this list
  may self-register at `/admin/register` with the shared 6-character access code
  and **choose their own display name**. `ADMIN_EMAIL` (super admin) is always
  allowed.
- Removed the old "only the very first admin may register" gate that was
  **redirecting genuine new admins back to the login page**. The allow-list is
  now enforced in the API route (`src/app/api/admin/register/route.ts`).
- Register form now has a **Full name** field and shows the **SAVEMI logo** next
  to the wordmark.

### Group B — Email (Resend)
- New library `src/lib/email.ts` (calls the Resend HTTP API via `fetch` — no SDK
  lock-in) and `src/lib/email-templates.ts` (clean, Scripture-backed, optimistic
  templates; every email carries a verse).
- **Admin email verification on registration**: a verification link is emailed;
  clicking it confirms the address and sends the **welcome** email.
  - Verification is **non-blocking** for login by design (see "Verification
    behaviour" below) so no one is ever locked out during handover.
- **Compose Email** page at `/admin/compose` (new sidebar item) lets an admin
  send a message through the ministry template, with an optional custom verse and
  a live preview. API: `src/app/api/admin/email/send/route.ts`.

### Group C — Uploads
- **Multipart uploads with per-part retry/backoff** for large files (over 32 MB)
  — a dropped connection only re-sends the failed part, never the whole file.
  Small files still use a single retried PUT. Client: `src/lib/admin-upload-client.ts`;
  server: `src/app/api/admin/upload-multipart/route.ts`; R2 helpers in `src/lib/r2.ts`.
- **Size caps raised** so 300 MB+ media is accepted: video 5 GB, audio 2 GB,
  image 512 MB (`src/lib/media.ts` + `AdminUploadField`).
- **Cover/image preview**: selecting an image now shows a thumbnail in the upload
  form so the admin sees exactly what they're uploading.

---

## 🔧 What YOU need to do (action items)

### 1. Run the database migration
A new migration adds `emailVerified`, `verifyToken`, `verifyTokenExpiry` to
`AdminUser` and backfills existing admins as already-verified (so nobody is
locked out).

```bash
npm run db:migrate:deploy    # prisma migrate deploy — run against production DB
```

Migration file: `prisma/migrations/20260724120000_add_admin_email_verification/`.

### 2. Set environment variables (Vercel + local `.env`)
See `.env.example` for the full list. New/required:

| Variable | Purpose | Example |
|---|---|---|
| `ADMIN_ALLOWED_EMAILS` | Emails allowed to self-register | `admin@savemionline.org,grace@savemionline.org` |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for email links | `https://savemionline.org` |
| `RESEND_API_KEY` | Resend API key (starts `re_`) | `re_xxxxxxxx` |
| `EMAIL_FROM` | Verified Resend sender | `SAVEMI <hello@savemionline.org>` |
| `EMAIL_REPLY_TO` | (optional) reply-to | `savemionline@gmail.com` |

> If `RESEND_API_KEY`/`EMAIL_FROM` are left blank, all email is disabled: new
> admins are auto-verified on registration and no mail is sent. The site still
> works — you just don't get verification/welcome/compose emails.

### 3. Set up Resend
1. Create an account at resend.com and add your domain (`savemionline.org`).
2. Add the DNS records Resend gives you (SPF/DKIM) in Cloudflare.
3. Once the domain shows **Verified**, create an API key → put it in `RESEND_API_KEY`.
4. Set `EMAIL_FROM` to an address on that verified domain.

### 4. Cloudflare R2 CORS (REQUIRED for large/multipart uploads)
Multipart uploads read the `ETag` response header from the browser, so the
bucket's CORS policy **must allow PUT and expose ETag**. In the Cloudflare
dashboard → R2 → your bucket → **Settings → CORS Policy**, add:

```json
[
  {
    "AllowedOrigins": [
      "https://savemionline.org",
      "https://www.savemionline.org",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Without `ExposeHeaders: ["ETag"]`, large uploads will fail at the "did not
return an ETag" step. (Small single-PUT uploads work without it but still need
PUT allowed.)

`AllowedOrigins` is matched exactly — scheme, host, and port. `savemionline.org`
and `www.savemionline.org` are two different origins, and each Vercel preview
URL is another. Any origin the admin office is served from and that is missing
here will fail the browser's preflight, and the upload dies before it reaches
R2: the browser sees only a network error, never an HTTP status.

To confirm the policy is right, open **Admin → Health → Upload check**. It
writes a test object from the server, then uploads one from the browser. If the
server half passes and the browser half fails, the origin is missing — the
check prints the exact address to add.

### 5. Cloudflare Email Routing (after Resend is confirmed — Group B follow-up)
This was scoped as a follow-up. Once email is confirmed working:
1. Cloudflare dashboard → your domain → **Email → Email Routing**.
2. Create a custom address, e.g. `hello@savemionline.org`, and route it to your
   existing Gmail as the destination.
3. Verify the destination Gmail (Cloudflare sends a confirmation).
4. Note: Cloudflare Email Routing handles **incoming** mail → Gmail. **Outgoing**
   ministry mail is sent by Resend. Keep `EMAIL_FROM` on the Resend-verified
   domain and set `EMAIL_REPLY_TO` to the Gmail/custom address if you want
   replies to land in Gmail.

---

## Verification behaviour (important)

- With email configured: registering creates the admin as **unverified**, sends a
  verification link, and the admin is guided to their inbox. They **can still log
  in** with the shared access code — verification is currently **informational /
  non-blocking** to avoid any lockout risk during handover.
- To make verification a **hard gate** later (block login until verified), add a
  check in `auth.ts` `authorize()`: after loading `admin`, return `null` when
  `admin.emailVerified` is null AND `isEmailConfigured()` AND the email is not the
  super admin. The migration already backfills existing admins as verified, and
  the super admin is seeded verified, so enabling this is safe.

## Notes / limitations
- Rate limits are in-memory (per warm instance) — fine for this scale.
- The `resend` npm package was installed but the code uses the HTTP API directly;
  the package is optional and can be removed if you prefer.
- Compose Email sends to each recipient individually (max 50 per send) so
  recipients never see each other's addresses.

## Quick test checklist
1. `npm run db:migrate:deploy`, set env, redeploy.
2. Add a second email to `ADMIN_ALLOWED_EMAILS`, register it at `/admin/register`
   with a name → should NOT bounce to login; verification email arrives.
3. Click the verification link → lands on login with "Email confirmed"; welcome
   email arrives.
4. Admin → Compose Email → send yourself a test.
5. Upload a 300 MB+ file in Messages → New → progresses to 100% and completes
   (confirm R2 CORS ExposeHeaders ETag first). Select a cover image → thumbnail
   preview shows.

---

# Group D & E — Public branding + media subdomain

## ✅ What changed
- **Tagline** is now **Repose · Renewal · Restoration** across the homepage
  pillars, footer, and welcome animation. Pillar verses (KJV):
  - **Repose** — Psalm 23:2 "He maketh me to lie down in green pastures"
  - **Renewal** — Isaiah 40:31 "They that wait upon the LORD shall renew their strength"
  - **Restoration** — Psalm 23:3 "He restoreth my soul"
- **Hero CTAs** ("Watch messages" / "Our story") stay on one row and are centred
  on mobile.
- **Real brand logos** (Facebook, YouTube, WhatsApp, Instagram, Email) as inline
  SVGs — `src/components/SocialIcons.tsx`.
- **Env-driven social handles** — `src/lib/social.ts`; rendered by
  `src/components/SocialLinks.tsx` in the footer, homepage CTA, and contact page.
- **Contact page** now shows Facebook / YouTube / WhatsApp / Email cards when
  configured.
- **Media subdomain** is env-driven via `CF_PUBLIC_BASE_URL`; `next.config.ts`
  now allows the media host for `next/image`.

## 🔧 What YOU need to do

### Social handles (set the env vars)
Set these in Vercel (and `.env`). Blank ones simply don't render:
`NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_YOUTUBE_URL`, `NEXT_PUBLIC_YOUTUBE_HANDLE`,
`NEXT_PUBLIC_WHATSAPP_URL` (full wa.me link or bare number),
`NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`.

### Media subdomain (Cloudflare) — media.savemionline.org
Since both your domain and storage are on Cloudflare, connect the R2 bucket to
the subdomain as a **Custom Domain** (this auto-creates the DNS + TLS):

1. Cloudflare dashboard → **R2** → your bucket → **Settings → Custom Domains**.
2. Click **Connect Domain**, enter `media.savemionline.org`, and confirm.
   Cloudflare adds the CNAME and provisions the certificate automatically.
3. Wait until it shows **Active**.
4. Set `CF_PUBLIC_BASE_URL="https://media.savemionline.org"` in your env and
   redeploy. All media URLs now resolve through the subdomain.

> The bucket must allow public read for that custom domain to serve files
> (R2 custom domains are public by default once connected).

### Cloudflare R2 CORS (required for uploads — same policy covers everything)
See the JSON below (also referenced in Group C).
