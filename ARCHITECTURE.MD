# SAVEMI Website Architecture

Written by Bespoke Technologies
bespoketech.com.ng
Motto: Engineering the solutions for this and the next generation.
Document date: 2026-06-03

## Engineering Purpose

This document is the engineering guide for the SAVEMI website. It explains how the application is structured, how data moves through the system, how admin access is protected, how media is uploaded, how the database is shaped, and how a developer should safely change the project.

SAVEMI is not only a marketing website. It is a ministry content operations system for Sabbath Vesper Ministry, with a public content library and a protected admin office. Public visitors can read and watch approved ministry content. Admin users can create, update, publish, archive, and export messages, books, quotes, and contact submissions.

## Mental Model

The project has four working parts.

The public website is the readable ministry surface. It contains the home page, about page, contact page, messages, books, and quotes. It must only show content that has been explicitly published.

The admin office is the protected content management surface. It contains the dashboard and CRUD screens for messages, books, quotes, contacts, admin users, platform health, and audit logs. It must never render admin tools to anonymous visitors.

The database is the source of truth for content, admin users, and audit records. Prisma maps the TypeScript application to the CockroachDB database. The database stores metadata, editorial state, generated slugs, titles, descriptions, and links to media assets.

The media store is Cloudflare R2. R2 stores uploaded media objects such as videos, audio, book covers, quote images, and other public assets. The application does not stream large files from the database. It stores object keys and resolves them into public or signed URLs.

Every feature in this project belongs to one of those parts. A change that writes data belongs to the admin office and must be authenticated. A change that displays content belongs to the public website and must filter by published state. A change that stores or retrieves large files belongs to R2, not the database. A change that modifies content structure belongs to Prisma migrations.

## Current Stack

The application is a Next.js App Router project using TypeScript.

| Layer | Technology | Purpose |
| --- | --- | --- |
| Framework | Next.js 16 | Routing, server rendering, route handlers, metadata, build output |
| UI | React 19 | Public and admin interface components |
| Styling | Tailwind CSS 4 | Global design system and responsive layout |
| Auth | Auth.js / NextAuth v5 beta | Admin login session and credentials provider |
| Database ORM | Prisma 5 | Type-safe database models, migrations, generated client |
| Database | CockroachDB | Persistent content, admins, contacts, audit logs |
| Media storage | Cloudflare R2 through S3-compatible SDK | Uploaded videos, audios, images, covers, and downloadable files |
| Icons | lucide-react | Admin and public UI iconography |
| Tests | Vitest | Unit tests for validation and utility logic |
| Deployment | Vercel | Production hosting and serverless route execution |

The project package name is `savemi`. The current local directory is still named `avemi-website`, but the package identity in `package.json` is `savemi`.

## Repository Layout

The source tree follows the App Router shape. Junior developers should learn this layout before touching business logic.

```text
avemi-website/
  auth.ts
  next.config.ts
  package.json
  prisma/
    schema.prisma
    seed.cjs
    migrations/
  src/
    app/
      page.tsx
      layout.tsx
      sitemap.ts
      about/
      books/
      contact/
      messages/
      quotes/
      admin/
      api/
    components/
    lib/
    proxy.ts
    styles/
  docs/
```

`auth.ts` is the Auth.js configuration. It defines how admins sign in, how sessions are created, and how the admin identity reaches the session object.

`src/proxy.ts` is the Next.js proxy layer. It protects `/admin/*` and `/api/admin/*` before the request reaches the page or route handler.

`src/app` contains all pages and API route handlers. A folder maps to a URL path. For example, `src/app/books/page.tsx` maps to `/books`, and `src/app/api/books/route.ts` maps to `/api/books`.

`src/app/admin/(protected)` contains admin pages that require a server-side session check. The parenthesized folder is a route group, so it does not appear in the URL. A file at `src/app/admin/(protected)/messages/page.tsx` still serves `/admin/messages`.

`src/components` contains reusable UI components. Components are shared between public pages and admin pages only when the shared behavior is actually the same.

`src/lib` contains business logic and infrastructure helpers. Database queries, upload validation, pagination, contact validation, rate limiting, and audit logging live here so route handlers stay focused.

`prisma/schema.prisma` defines the database. Migrations under `prisma/migrations` are the historical changes that bring a database to the current schema.

## Execution Commands

Use these commands from the `avemi-website` directory.

```powershell
npm install
npm run dev
npm run build
npm run test
npm run lint:strict
npm run db:generate
npm run db:migrate
npm run db:migrate:deploy
npm run db:seed
```

`npm run dev` starts the local development server with webpack. This avoids the current Next.js 16 Turbopack dev-mode issue where Auth.js catch-all routes can return `404` locally even though the production build is correct.

`npm run build` runs `prisma generate` first, then builds the Next.js app.

`npm run test` runs the Vitest test suite.

`npm run lint:strict` is the working ESLint quality gate. The `lint` script currently calls `next lint`, which is a legacy command for this installed Next.js version. Use `lint:strict` unless the script is changed.

`npm run db:migrate` is for local development migrations. Production uses `npm run db:migrate:deploy`.

`npm run db:seed` is safe only when the seed behavior is understood. In development, the seed script deletes content tables before inserting starter data. In production, it avoids destructive content deletion and only bootstraps the configured admin user.

## Environment Variables

The app reads secrets from environment variables. Do not hardcode secrets in source files. Do not commit `.env`.

| Variable | Required | Used By | Meaning |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Prisma | Pooled database connection |
| `DIRECT_URL` | Yes for migrations | Prisma | Direct migration connection |
| `NEXTAUTH_URL` | Yes in production | Auth.js | Canonical auth callback URL |
| `NEXTAUTH_SECRET` | Yes in production | Auth.js | Session signing secret |
| `AUTH_SECRET` | Yes in production | Auth.js | Auth.js secret alias |
| `ADMIN_EMAIL` | Yes for seed bootstrap and admin-user control | Seed/admin permissions | First admin email and configured super-admin email |
| `ADMIN_NAME` | Optional | Seed | First admin display name |
| `ADMIN_ACCESS_CODE` | Yes | Auth/admin registration | Six-character shared admin code |
| `ADMIN_PASSWORD` | Supported fallback | Auth/admin registration | Legacy name for same six-character code |
| `CF_ACCOUNT_ID` | Yes for uploads | R2 | Cloudflare account ID |
| `CF_ACCESS_KEY_ID` | Yes for uploads | R2 | R2 access key |
| `CF_SECRET_ACCESS_KEY` | Yes for uploads | R2 | R2 secret key |
| `CF_BUCKET` | Yes for uploads | R2 | R2 bucket name |
| `CF_PUBLIC_BASE_URL` | Recommended | R2 asset resolution | Public CDN/base URL for stored objects |

`src/lib/db.ts` checks whether the database is configured before Prisma-backed work runs.

`src/lib/r2.ts` checks whether R2 is configured before upload signing or signed downloads are created.

## Public Routes

The public routes are the ministry visitor experience. They must remain readable, fast, responsive, accessible, and editorially clean.

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Home page, hero media, featured video/audio, ministry statement, calls to action |
| `/about` | `src/app/about/page.tsx` | Ministry identity, mission, Sabbath focus, Calabar context |
| `/contact` | `src/app/contact/page.tsx` | Contact form for ministry inquiries |
| `/messages` | `src/app/messages/page.tsx` | Published message listing |
| `/messages/[id]` | `src/app/messages/[id]/page.tsx` | Published message detail and media playback |
| `/books` | `src/app/books/page.tsx` | Published book/resource listing |
| `/books/[slug]` | `src/app/books/[slug]/page.tsx` | Published book/resource detail |
| `/quotes` | `src/app/quotes/page.tsx` | Published quote gallery |
| `/quotes/[slug]` | `src/app/quotes/[slug]/page.tsx` | Published quote detail |
| `/sitemap.xml` | `src/app/sitemap.ts` | Search engine sitemap |

Public pages use query helpers in `src/lib/messages.ts`, `src/lib/books.ts`, and `src/lib/quotes.ts`. Those helpers are responsible for returning only content with `status = PUBLISHED` for public rendering.

The public writing direction is Seventh-day Sabbath focused. The site metadata describes SAVEMI as Sabbath Vesper Ministry in Calabar, Nigeria, sharing biblical reflection on the seventh-day Sabbath through teaching, worship, and Reflection at Eventide. A suitable foundation text for this content direction is Exodus 20:8, KJV: "Remember the sabbath day, to keep it holy."

## Admin Routes

Admin routes are the private operations surface. They are protected twice: first by `src/proxy.ts`, then by the protected admin layout.

| Route | Purpose |
| --- | --- |
| `/admin/login` | Admin sign-in |
| `/admin/register` | Bootstrap the first admin; after bootstrap, admin creation is super-admin controlled |
| `/admin` | Admin dashboard |
| `/admin/messages` | List, search, filter, export messages |
| `/admin/messages/new` | Create a message |
| `/admin/messages/[id]/edit` | Edit a message |
| `/admin/books` | List, search, filter, export books |
| `/admin/books/new` | Create a book/resource |
| `/admin/books/[id]/edit` | Edit a book/resource |
| `/admin/quotes` | List, search, filter, export quotes |
| `/admin/quotes/new` | Create a quote |
| `/admin/quotes/[id]/edit` | Edit a quote |
| `/admin/contacts` | View contact submissions |
| `/admin/admin-users` | Super-admin-only admin account management |
| `/admin/health` | Database-backed platform health, launch checks, and operational analytics |
| `/admin/guide` | In-app version of the owner operating handbook |
| `/admin/audit-log` | View recent admin write actions |

The admin shell is split into route groups so login and registration can remain visually simple while protected admin pages receive the full admin layout.

The protected layout is intentionally small:

```tsx
// src/app/admin/(protected)/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
```

That layout is the safety net that prevents anonymous visitors from seeing admin UI if proxy matching changes or a route is moved inside the protected group. Developers must keep all private admin screens under `src/app/admin/(protected)`.

## API Routes

The route handlers under `src/app/api` expose public read endpoints and protected admin write endpoints.

### Public API

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/messages` | `GET` | Paginated published messages |
| `/api/messages/[id]` | `GET` | One published message by id or slug |
| `/api/messages/hero` | `GET` | Published hero message |
| `/api/books` | `GET` | Paginated published books/resources |
| `/api/books/[slug]` | `GET` | One published book/resource |
| `/api/quotes` | `GET` | Paginated published quotes |
| `/api/quotes/[slug]` | `GET` | One published quote |
| `/api/contact` | `POST` | Validated contact submission |
| `/api/upload-url` | `POST` | Removed public upload endpoint, returns `410` |

Public APIs must never expose draft or archived content. They should return published content only, using normalized pagination and filters.

### Admin API

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/admin/messages` | `GET`, `POST` | List all messages, create message |
| `/api/admin/messages/[id]` | `PATCH`, `DELETE` | Update or delete message |
| `/api/admin/books` | `GET`, `POST` | List all books, create book |
| `/api/admin/books/[id]` | `PATCH`, `DELETE` | Update or delete book |
| `/api/admin/quotes` | `GET`, `POST` | List all quotes, create quote |
| `/api/admin/quotes/[id]` | `PATCH`, `DELETE` | Update or delete quote |
| `/api/admin/export` | `GET` | Export messages, books, or quotes as CSV |
| `/api/admin/register` | `POST` | Bootstrap first admin; after bootstrap, super-admin-only admin creation |
| `/api/admin/users` | `GET`, `POST` | Super-admin-only admin listing and creation |
| `/api/admin/users/[id]` | `PATCH`, `DELETE` | Super-admin-only admin update and delete |
| `/api/admin/upload-url` | `POST` | Generate signed Cloudflare R2 upload URL |

Admin APIs are covered by proxy auth and should still check `auth()` inside the route handler when they perform writes. Route-level checks make the endpoint safe even if the proxy matcher is edited later.

The current route guard pattern looks like this:

```ts
// Route handlers under src/app/api/admin/*
import { auth } from "../../../../../auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized. Admin session required." },
      { status: 401 },
    );
  }

  // Validate body, perform write, audit action.
}
```

Use this pattern for every new admin write endpoint.

## Database Model

The database is defined in `prisma/schema.prisma`. The models are small enough for junior developers to understand directly.

`Message` represents sermons, Sabbath reflections, audio teachings, image posts, and hero media. It stores title, slug, summary, description, media type, editorial status, placement, speaker, scripture reference, event date, media keys, external media URL, duration, category, and publish timestamp.

`Category` groups messages. A message can have no category. Deleting a category does not delete the message; the message category becomes null.

`ContactSubmission` stores public contact form entries. It stores name, email, message body, created time, and optional responded time.

`Book` represents books and ministry resources. It supports free resources and paid resources through `availability`, `downloadUrl`, `purchaseUrl`, `priceLabel`, and related metadata.

`Quote` represents short written quotes, scripture-linked reflections, and quote images. It supports featured quotes and publish status.

`AdminUser` stores admin identity. It includes email, bcrypt hash of the configured admin access code, display name, timestamps, and audit log relationship.

`AuditLog` stores admin write actions. It records who acted, what action happened, what entity was affected, optional JSON detail, IP address, and time.

The enums are:

| Enum | Values | Meaning |
| --- | --- | --- |
| `MessageType` | `VIDEO`, `AUDIO`, `IMAGE` | Media class for messages |
| `MessageStatus` | `DRAFT`, `PUBLISHED`, `ARCHIVED` | Editorial state |
| `MessagePlacement` | `STANDARD`, `HERO` | Normal listing or home hero placement |
| `BookAvailability` | `FREE`, `PAID` | Free download/resource or paid external purchase |

Published public content is controlled by `MessageStatus`. A record can exist in the database without being visible to the public. This is the core editorial boundary.

## Editorial Rules

The admin workflow has a few rules that must stay consistent.

A public page must only show records with `status = PUBLISHED`.

A draft can be created without being public. This lets admins prepare content before release.

An archived record should not appear in public listings. It remains in the database so the team can preserve history and avoid accidental data loss.

A hero message must have `placement = HERO` and `status = PUBLISHED` to appear as the public hero media.

Only one published hero should be active. When a new published hero is saved, the admin route demotes other published hero records to `STANDARD`.

Books and quotes reuse `MessageStatus` so the editorial behavior stays familiar across content domains.

## Slug Automation

Admins do not type slugs. The admin UI removes slug fields for messages, books, and quotes, and the server generates the slug from the title during create and update operations.

`src/lib/slugs.ts` owns slug behavior. `slugifyTitle()` normalizes a title into a URL-safe lowercase path segment. The unique slug helpers check the database and append a numeric suffix when another record already uses the same generated slug.

```text
title: Remember the Sabbath Day
slug: remember-the-sabbath-day

title: Remember the Sabbath Day
slug: remember-the-sabbath-day-2
```

The public website still reads detail pages by the stored slug for books and quotes. Message detail pages continue to support the current public message route shape. Because the server regenerates slugs from titles, changing a published title can change the public URL for that record. Admin screens should therefore treat title edits on published content as editorial decisions, not casual spelling changes.

Never trust a client-supplied slug in an admin write endpoint. If a future form accidentally sends `slug`, the API should ignore it and derive the stored value from the submitted title.

## Admin Authentication

Auth is configured in `auth.ts` using Auth.js credentials. Admins sign in with an email address and a configured six-character shared admin access code. The code is read from `ADMIN_ACCESS_CODE`, with `ADMIN_PASSWORD` supported as a legacy fallback.

The login flow does three checks.

First, the submitted password must match the configured six-character code. If the environment code is missing or not six characters long, login fails.

Second, the normalized email must already exist in the `AdminUser` table. A person with only the shared code cannot sign in unless the email is registered.

Third, the stored bcrypt hash is compared against the configured access code. If the configured code changed and the admin email is valid, the hash is updated after successful code verification.

The session uses JWT strategy with an eight-hour max age. The session callback copies the admin id into `session.user.id`, which audit logging uses.

The proxy is the first access boundary:

```ts
// src/proxy.ts
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
```

The proxy allows login, bootstrap registration, and Auth.js routes. It protects every other admin page and API route. Anonymous admin API calls receive `401`. Anonymous admin page requests redirect to `/admin/login`.

Admin registration is intentionally constrained. The first admin can be created during bootstrap if no admin exists. After at least one admin exists, `/api/admin/register`, `/api/admin/users`, `/api/admin/users/[id]`, and `/admin/admin-users` require the authenticated user to match the configured `ADMIN_EMAIL`. `src/lib/admin-permissions.ts` centralizes that super-admin check. This prevents ordinary admins and public visitors from creating or modifying admin accounts after bootstrap.

Admin deletion is intentionally conservative. The system refuses to delete the current active admin, the configured super admin, or the last remaining admin account. When audit logs exist, delete operations try to preserve historical audit rows by assigning them to the acting super admin before the admin record is removed.

## Media Upload Architecture

Large media files do not pass through the Next.js server. The admin asks the server for a signed upload URL, then the browser uploads directly to Cloudflare R2.

The flow is:

1. Admin selects a file in an admin form.
2. The browser sends file metadata to `/api/admin/upload-url`.
3. The route checks the admin session.
4. The route validates file name, MIME type, and declared size.
5. The route creates an R2 object key.
6. The route signs a short-lived `PUT` URL.
7. The browser uploads the file directly to R2.
8. The admin form stores the returned object key in the content record.
9. Public pages resolve the object key into a public URL or signed download URL.

The old public upload signing endpoint is removed:

```ts
// src/app/api/upload-url/route.ts
export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been removed. Use /api/admin/upload-url instead.",
    },
    { status: 410 },
  );
}
```

Allowed uploads are defined in `src/lib/media.ts`.

| Media kind | MIME types | Limit |
| --- | --- | --- |
| Video | `video/mp4`, `video/webm`, `video/quicktime` | 500 MB |
| Audio | `audio/mpeg`, `audio/mp4`, `audio/wav`, `audio/x-wav` | 100 MB |
| Image | `image/jpeg`, `image/png`, `image/webp` | 15 MB |

Object keys are generated with this structure:

```text
media-kind/year/month/random-id-sanitized-file-name
```

Example:

```text
video/2026/06/4df5c4ea-2c8a-44ce-sabbath-reflection.mp4
```

`src/lib/r2.ts` resolves assets as follows. Full `http://` or `https://` URLs pass through unchanged. Local paths that start with `/` pass through unchanged. R2 object keys use `CF_PUBLIC_BASE_URL` when configured. If no public base URL is configured, the server can create a signed download URL.

### R2 Bucket CORS

The browser uploads directly to a presigned R2 `PUT` URL. The bucket CORS policy must therefore allow the application origins, `PUT`, and the request headers sent by the browser upload. A `GET`-only policy is not enough; it allows reads but blocks direct uploads.

Current production-ready policy:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3004",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3004",
      "https://savemi.vercel.app",
      "https://savemi.org",
      "https://www.savemi.org"
    ],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 86400
  }
]
```

This policy has been applied and verified with a browser-equivalent preflight from `http://localhost:3004` and a signed `PUT` upload probe. The preflight returned `204`, the upload returned `200`, and the temporary object was deleted.

## Contact Flow

The contact form posts to `/api/contact`. The route accepts JSON or form data, validates the payload, rate-limits by IP, and stores a `ContactSubmission`.

Validation happens in `src/lib/contact.ts`. The expected fields are name, email, and message. A honeypot field named `website` catches many automated spam submissions.

The contact limiter allows five submissions per ten minutes per IP. The limiter is an in-memory sliding-window implementation. It helps reduce automated abuse, but it resets on serverless cold starts and should not be treated as a forensic security control.

## Audit Logging

Admin writes call `audit()` from `src/lib/audit.ts`. Audit records are stored in the `AuditLog` table and displayed under `/admin/audit-log`.

The audit helper records:

```text
adminId
adminEmail
action
entityType
entityId
detail
ip
createdAt
```

Audit logging intentionally does not block the primary action. If audit insertion fails, the write operation still completes. This prevents an audit-table issue from taking down publishing, but it also means production monitoring should alert on audit failures once observability is added.

Use these action names:

```text
message.create
message.update
message.delete
book.create
book.update
book.delete
quote.create
quote.update
quote.delete
admin.register
admin.create
admin.update
admin.delete
```

Do not invent new action names casually. If a new admin operation is added, extend the `AuditAction` type and keep naming consistent.

## Platform Health And Analytics

`/admin/health` is the database-backed operations screen for launch and support work. It summarizes content counts, draft and published states, contact submissions, admin user state, R2 configuration, database reachability, super-admin configuration, audit trail status, recent write activity, and launch warnings.

The health page answers practical operating questions: whether the database is reachable, whether required schema changes appear to be present, whether audit logging can be read, which content areas are active, and whether admin ownership is configured. It uses existing database tables only. No external analytics service, tracking script, new API, or new database table was introduced for public page-view tracking.

Audit analytics on `/admin/health` are derived from `AuditLog`. They show who acted, what operation happened, which entity type was affected, when actions happened, and how actions were grouped. If the `AuditLog` table is missing because migrations have not completed, the page reports that as a launch warning instead of crashing.

## Pagination

Public list APIs use cursor pagination through `src/lib/pagination.ts`. The cursor is a base64url-encoded JSON object containing the record id and created time.

The default page size is 20. The maximum page size is 96.

Cursor pagination is preferred because it is stable when new content is inserted while users browse. Offset pagination can skip or duplicate rows when content changes between requests.

The API response shape should be:

```json
{
  "data": [],
  "meta": {
    "nextCursor": null,
    "hasMore": false,
    "limit": 20
  }
}
```

Keep public API response shapes consistent. Admin APIs can return different shapes if the admin UI expects them, but public read APIs should be predictable.

## Seed Behavior

The seed file is `prisma/seed.cjs`. It has two different responsibilities.

In development, it can delete and recreate sample content. This is useful when building the app locally, but it is destructive.

In production, it must not delete ministry content. It only bootstraps or updates the configured admin user from environment variables.

Never run a destructive seed operation against production data. If content import is needed, create a separate non-destructive import script or use admin screens.

## Deployment Flow

The production deployment target is Vercel. The current successful production deployment URL is `https://savemi.vercel.app`. The metadata in `src/app/layout.tsx` uses `https://savemi.org` as the intended canonical public domain.

The standard deployment flow is:

1. Confirm local changes.
2. Run `npm run test`.
3. Run `npm run lint:strict`.
4. Run `npm run build`.
5. Confirm production environment variables.
6. Run production database migrations with `npm run db:migrate:deploy` if schema changed.
7. Deploy to Vercel.
8. Smoke test public and admin routes.

### Current Migration Status

As of 2026-06-03, `npm run db:migrate:deploy` has successfully applied all migrations in this codebase. A direct `_prisma_migrations` check confirms finished rows for `20260521000000_add_audit_log` and `20260521100000_add_external_media_url`.

The repaired migration was `20260521000000_add_audit_log`. It was made CockroachDB-compatible by removing the unsupported `gen_random_id()` default from the `AuditLog.id` column. Prisma supplies string ids through the schema-level `cuid()` behavior, matching the existing admin user pattern. After the failed migration row was marked rolled back, `npm run db:migrate:deploy` applied both `20260521000000_add_audit_log` and `20260521100000_add_external_media_url`.

`npx prisma migrate status` returned "Database schema is up to date" after the successful deploy, but later retries intermittently returned a generic schema-engine error while TCP connectivity to CockroachDB was open. Treat that as a Prisma/Cockroach connectivity issue to monitor during launch.

Current launch rule: every production release that changes the schema must run `npm run db:migrate:deploy`, then `npx prisma migrate status` from a stable connection, then `/admin/health`. Do not approve launch if migrate status is not up to date or if `/admin/health` reports audit trail or required schema warnings.

The minimum smoke test after deployment is:

```text
GET /                         should return 200
GET /about                    should return 200
GET /messages                 should return 200
GET /books                    should return 200
GET /quotes                   should return 200
GET /admin                    should redirect to /admin/login when anonymous
GET /admin/messages           should redirect to /admin/login when anonymous
GET /admin/admin-users        should redirect to /admin/login when anonymous
GET /admin/health             should redirect to /admin/login when anonymous
GET /admin/guide              should redirect to /admin/login when anonymous
GET /api/admin/messages       should return 401 when anonymous
GET /api/admin/users          should return 401 when anonymous
POST /api/upload-url          should return 410
```

If admin login is available, also verify that a valid admin can sign in, view the dashboard, open `/admin/health`, create a draft record, and sign out. The configured super admin must also verify `/admin/admin-users` and confirm that ordinary admins cannot manage other admins.

## Security Invariants

These rules must not be broken.

Public users must never see protected admin UI.

Public users must never call admin write endpoints successfully.

Public upload signing must stay removed. Upload signing belongs under `/api/admin/upload-url`.

Public pages must never display draft or archived content.

Admin registration and admin user CRUD after bootstrap must require the configured super admin.

Admin user pages and APIs must not be visible or usable by ordinary admins.

Admin content APIs must generate slugs from titles and ignore client-supplied slug fields.

Admin writes must create audit records where the current helper supports it.

The admin access code must not be printed in logs, committed to Git, or exposed in browser-rendered text.

Database credentials, auth secrets, and R2 keys must stay in environment variables.

Server code must validate write payloads. Client-side validation is useful for experience but cannot be trusted for security.

## Error Handling

Route handlers should return clear JSON errors for API callers. Avoid leaking secrets or internal connection strings.

Public query helpers currently return empty content if the database is missing or a query fails. That keeps the public pages from crashing during setup, but it can hide production outages as empty sections. Production observability should eventually report those failures.

Admin write handlers should fail closed. If auth, validation, database writes, or critical storage checks fail, return an error and do not perform the action.

Audit failures are intentionally non-blocking.

## UI And Accessibility Direction

The site should feel like a ministry content platform, not a generic landing page. It should be quiet, readable, reverent, and operationally clear.

Public pages should use plain ministry language, strong hierarchy, clear calls to action, and responsive layouts. Mobile users should be able to read, watch, listen, and navigate without horizontal scrolling.

Admin pages should be dense but readable. They are tools for repeated content work, so predictable navigation and visible states matter more than decoration.

Use accessible form labels, visible focus states, sufficient contrast, semantic headings, keyboard-accessible controls, and descriptive link text. For any UI change, test on a narrow viewport and a desktop viewport.

The content voice should stay aligned with SAVEMI's Seventh-day Sabbath focus. Scripture references must be accurate and traceable. When the site uses direct Bible quotations, include the book, chapter, verse, and translation.

## How To Add A New Public Page

Create a route folder inside `src/app`. For a public page at `/example`, create `src/app/example/page.tsx`.

Use server components by default. Reach for client components only when there is browser-only state, form interaction, media controls, or animation.

Add metadata when the page is indexable. Make the title specific and keep the description plain.

If the page reads database content, put reusable query logic in `src/lib`. The page should call the helper rather than embedding complex Prisma queries directly in the component.

Make sure the page has loading, empty, and error behavior appropriate to its route.

## How To Add A New Admin Page

Place the page under `src/app/admin/(protected)`. Do not place private pages directly under `src/app/admin` unless they are public-auth pages such as login or bootstrap registration.

Add a sidebar link only when the page is a primary admin workflow.

If the page writes data, create or reuse a protected route handler under `src/app/api/admin`.

Every write route must:

```text
check auth
parse body
validate body
perform write
audit write
return a typed JSON response
```

Avoid `any`. Use narrow TypeScript types, generated Prisma types, or explicit `Record<string, unknown>` parsing when handling unknown request bodies.

## How To Add A New Database Field

Change `prisma/schema.prisma` first. Think about nullability, defaults, indexes, and whether existing production rows need backfill data.

Run:

```powershell
npm run db:migrate
npm run db:generate
```

Then update affected query helpers, admin forms, admin APIs, public pages, tests, and docs.

Before production, run the migration against a staging or disposable database if possible. Use `npm run db:migrate:deploy` in production.

Never edit a migration that has already been applied to a shared or production database unless the team has explicitly approved migration repair work.

## How To Add A New Upload Type

Add the MIME type and size rule in `src/lib/media.ts`. Decide whether it is video, audio, or image, or whether a new media kind is actually needed.

Update admin upload fields and any public rendering component that needs to display the new file type.

Update tests in `src/lib/media.test.ts`.

Do not add a public upload signing endpoint. Keep uploads behind admin auth.

## Testing Strategy

The current test suite focuses on helper logic. The most important tests are validation tests, because they protect high-risk inputs.

Run:

```powershell
npm run test
```

At minimum, tests should cover:

```text
contact validation
upload validation
pagination cursor behavior
admin bootstrap and super-admin rules
slug generation and uniqueness
public filtering rules
hero demotion rule
```

Route and browser smoke tests should be added as the project matures. The highest-value browser checks are admin auth protection, public navigation, contact form submission, media upload, and publish visibility.

## Common Failure Modes

If public pages show no content, check whether the database is configured, whether records are published, whether the route helper filters are correct, and whether a failed query is being swallowed.

If admin login fails, check the admin email exists in `AdminUser`, the access code is exactly six characters, `NEXTAUTH_SECRET` and `AUTH_SECRET` are configured, and the deployed `NEXTAUTH_URL` matches the site URL.

If uploads fail, check R2 environment variables, bucket permissions, MIME type, declared file size, and whether the admin is logged in.

If images do not render, check whether the value is a full URL, local `/` path, or R2 object key. Then check `CF_PUBLIC_BASE_URL` and `next.config.ts` remote image patterns.

If production migration fails, check `DATABASE_URL`, `DIRECT_URL`, CockroachDB compatibility, and applied migration history. If a migration had a previous failed attempt, repair the SQL first, mark only the failed row as rolled back, rerun `npm run db:migrate:deploy`, and confirm `npx prisma migrate status` reports the database schema is up to date.

If admin pages render publicly, immediately inspect `src/proxy.ts`, confirm the `matcher` includes `/admin/:path*`, and confirm the page is inside `src/app/admin/(protected)`.

If `/admin/health` reports missing audit logs or missing schema fields, treat the deployment as incomplete. The page is designed to stay readable during migration problems, not to excuse them.

## Knowledge Triage

Must know by heart:

```text
Admin write paths belong under /api/admin and require auth.
Admin pages belong under src/app/admin/(protected).
Only the configured ADMIN_EMAIL can manage admin users after bootstrap.
Public pages show only PUBLISHED content.
Content slugs are generated by the server from titles.
Upload signing belongs only at /api/admin/upload-url.
The database stores metadata; R2 stores large media files.
Production migrations use migrate deploy, not migrate dev.
The development seed can delete content.
```

Must recognize:

```text
Auth.js session shape and JWT callbacks.
Prisma generated types and migrations.
Next.js App Router page and route-handler conventions.
R2 signed upload and public asset URL resolution.
Cursor pagination response shape.
Audit log naming and admin write attribution.
Platform health checks and launch warnings.
```

Lookup-only:

```text
Exact CockroachDB migration SQL for advanced schema repair.
Current Auth.js v5 beta release notes.
Cloudflare R2 bucket CORS and public access configuration.
Vercel environment variable and deployment UI details.
WCAG 2.2 test procedures for formal accessibility audits.
```

## Engineering Standard

Every production change should have a clear reason, a narrow implementation, a verification command, and a rollback path.

For SAVEMI, a change is done only when the affected public page, admin screen, API route, database shape, tests, and documentation have been considered. A build passing is a useful signal, but security-sensitive changes need negative checks as well. Anonymous admin requests should be tested as intentionally as successful admin requests.

Keep the codebase boring where it matters. Use existing helpers, existing route patterns, and existing UI conventions before adding new abstractions.
