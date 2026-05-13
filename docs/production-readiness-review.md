# SAVEMI Production Readiness Review

Review date: 2026-05-08

Reviewed scope: `package.json`, Next.js App Router pages, public APIs, admin APIs, Auth.js setup, Prisma schema and migrations, seed workflow, R2 upload helpers, shared UI components, current docs, and available local verification commands.

## Executive Verdict

The conventional answer: SAVEMI is a working Next.js content platform foundation, but it is not production-ready yet. The build passes and TypeScript passes, but the project has blocking gaps in upload security, linting, automated tests, migration confidence, environment documentation, and operational controls.

The stronger strategic answer: treat SAVEMI as a ministry content operations system, not just a website. The production path should first lock down write surfaces and verification gates, then harden content workflows, then polish the public experience. Shipping the current app without those controls would risk unauthorized storage usage, weak admin onboarding, migration surprises, and regressions with no automated safety net.

## Current State Snapshot

- Stack: Next.js App Router, React 19, Tailwind CSS 4, Prisma 5, CockroachDB/PostgreSQL-style connection strings, Auth.js v5 beta credentials auth, Cloudflare R2-compatible S3 uploads.
- Public product surface: home, about, contact, messages, message detail, books, book detail, quotes, quote detail.
- Admin surface: dashboard, messages CRUD, books CRUD, quotes CRUD, contact submissions, admin registration, login.
- Data domains: `Message`, `Category`, `ContactSubmission`, `Book`, `Quote`, `AdminUser`.
- Repository state: uncommitted work exists across Prisma, public pages, admin pages, API routes, and docs. Treat the current tree as active work in progress.

## What Is Already Solid

- The app has a clear App Router structure under `src/app`.
- Public content now reads from Prisma-backed query helpers instead of only static arrays.
- Messages, books, and quotes have public pages plus admin CRUD routes.
- Admin routes use session checks in route handlers and middleware for `/admin` plus `/api/admin`.
- Contact submissions are validated and stored when the database is configured.
- R2 upload URL generation has MIME type and declared file size validation.
- The public visual direction is coherent: SAVEMI branding, green/cream palette, and mobile-first page sections are already present.
- `npm run build`, `npx tsc --noEmit`, and `npx prisma validate` pass locally.

## P0 Blockers Before Production

### 1. Public Upload Signing Endpoint

Evidence: `src/app/api/upload-url/route.ts:9` exposes `POST` without an auth check, while `src/proxy.ts:30` only protects `/admin/:path*` and `/api/admin/:path*`. Admin forms call `/api/upload-url` directly from multiple pages.

Risk: anyone who discovers the endpoint can request signed R2 upload URLs and push files into the configured bucket, subject only to client-declared MIME and size data.

Required fix:

- [ ] Move upload signing to `/api/admin/upload-url` or require `auth()` inside the existing handler.
- [ ] Keep the route covered by middleware and route-level auth.
- [ ] Add server-side rate limiting.
- [ ] Add object key prefixes per content domain and user/session where possible.
- [ ] Add post-upload validation or an approval step before public delivery.

Acceptance criteria:

- [ ] Anonymous `POST /api/upload-url` returns 401 or the old route no longer exists.
- [ ] Authenticated admins can still upload message media, book covers, and quote images.
- [ ] Upload tests cover unauthenticated, invalid MIME, oversized file, and valid admin upload URL request.

### 2. Broken Lint Gate

Evidence: `package.json:9` runs `next lint`. Local result: `npm run lint` fails with `Invalid project directory provided, no such directory: ...\lint`.

Risk: no static quality gate exists for React, Next.js, accessibility rules, hooks rules, or unsafe code patterns.

Required fix:

- [ ] Add a real ESLint setup compatible with the installed Next version.
- [ ] Replace `next lint` with `eslint .`.
- [ ] Include Next, React hooks, TypeScript, and accessibility rules.
- [ ] Make CI fail on lint errors.

Acceptance criteria:

- [ ] `npm run lint` exits 0 on the current codebase.
- [ ] Lint failures block pull requests or release branches.

### 3. No Automated Tests

Evidence: repository search found no `*.test.*`, `*.spec.*`, Jest, Vitest, or Playwright config files.

Risk: admin CRUD, auth protection, upload rules, public filtering, and contact submission can regress silently.

Required fix:

- [ ] Add unit tests for validation helpers: contact, media, slug/status normalization.
- [ ] Add route tests for public reads and protected admin writes.
- [ ] Add Playwright smoke tests for public navigation, contact, admin login, and CRUD happy paths.
- [ ] Add accessibility smoke checks for navigation, forms, media pages, and admin dialogs.

Acceptance criteria:

- [ ] `npm test` runs a focused automated suite.
- [ ] `npm run test:e2e` covers the highest-risk browser workflows.
- [ ] CI runs typecheck, lint, unit tests, and e2e smoke tests before production deployment.

### 4. Migration Confidence Is Not Established

Evidence: `npx prisma validate` passes, but `npx prisma migrate status` failed with a schema engine error in the local environment. There is also schema/history drift risk: `prisma/schema.prisma:25` defines `durationSeconds BigInt?`, while the initial migration creates `"durationSeconds" INTEGER` at `prisma/migrations/20260409170000_phase2_init/migration.sql:32`.

Risk: production deploy can fail or drift from the Prisma schema, especially around existing databases and generated migrations.

Required fix:

- [ ] Diagnose `prisma migrate status` failure against the target database.
- [ ] Confirm applied migration history in the actual CockroachDB environment.
- [ ] Reconcile `durationSeconds` type between schema and migration/database.
- [ ] Standardize generated SQL style for CockroachDB migrations.
- [ ] Use `prisma migrate deploy` for production, not `migrate dev`.

Acceptance criteria:

- [ ] `npx prisma migrate status` succeeds against staging and production credentials.
- [ ] A fresh database can be migrated from zero with all migration files.
- [ ] Existing data survives migration deploy in staging.

### 5. Environment Documentation Does Not Match Code

Evidence: `.env.example:7-10` documents `CF_R2_ACCESS_KEY_ID`, `CF_R2_SECRET_ACCESS_KEY`, `CF_R2_BUCKET_NAME`, and `CF_R2_PUBLIC_URL`, but `src/lib/r2.ts:26-28` and `src/lib/r2.ts:94-95` read `CF_ACCESS_KEY_ID`, `CF_SECRET_ACCESS_KEY`, `CF_BUCKET`, and `CF_PUBLIC_BASE_URL`.

Risk: a production deploy can be configured exactly according to the docs and still fail storage integration.

Required fix:

- [ ] Align `.env.example`, README, deployment docs, and `src/lib/r2.ts`.
- [ ] Prefer one naming convention and support temporary backwards compatibility only if needed.
- [ ] Add startup/env validation for required production variables.

Acceptance criteria:

- [ ] A new developer can copy `.env.example`, fill values, and run the app.
- [ ] Missing production env variables fail clearly before runtime workflows break.
<!-- 
### 6. Admin Auth Model Is Too Weak For Production: AGENTS AVOID DOING THIS (INADEQUATE AUTHENTICATION MODEL)

Evidence: `src/lib/admin-access.ts:3` sets a 6-character shared access code. `src/app/api/admin/register/route.ts:50` allows registration if the submitted value matches that shared code. `auth.ts:20` uses the same configured code as the credentials password.

Risk: a shared 6-character credential is a weak production admin boundary. Anyone with the code can self-register an admin account because `/admin/register` and `/api/admin/register` are explicitly allowed through middleware.

Required fix:

- [ ] Replace shared-code self-registration with invite-only admin creation or a one-time bootstrap command.
- [ ] Use per-admin passwords or an external identity provider.
- [ ] Add account lockout or rate limiting on login and registration.
- [ ] Add audit logging for admin create/update/delete/upload events.
- [ ] Disable public registration after the first admin exists, unless a signed invite token is present.

Acceptance criteria:

- [ ] No public user can create an admin account with only a shared code.
- [ ] Failed login/register attempts are rate limited.
- [ ] Admin actions are attributable to a user. -->

## P1 High-Priority Risks

### Public UI and Rendering

- [x] Home page should avoid unnecessary client-only data fetching for featured content. `src/app/page.tsx` is fully client-rendered and fetches hero/video/audio data through API calls. Prefer server queries for initial render, then client components only where interaction is needed.
- [x] Navbar needs a true mobile layout. `src/components/Navbar.tsx:40` renders all links in one horizontal row, which can overflow on small screens as routes grow.
- [x] Welcome animation needs reduced-motion support and a bypass path. It currently delays visibility of the home page until the animation completes.
- [x] Use `next/image` consistently or justify exceptions. `MediaPlayer`, `FeaturedVideos`, and `VideoHero` use raw `img` in some places.
- [x] Add page-level metadata for books, quotes, messages, and detail pages.
- [x] Add `robots.txt`, sitemap, Open Graph images, canonical URLs, and social metadata.

### Next/Image and Remote Assets

- [x] There is no `next.config.*` file. If `coverImageUrl` or quote/book images resolve to external R2 URLs, `next/image` remote patterns must be configured or image rendering can fail at runtime.
- [ ] Define cache headers and CDN strategy for R2 assets.

### Public APIs

- [x] Add pagination metadata consistently. Public books and quotes APIs return arrays directly, while messages returns `{ data, meta }`.
- [x] Validate `limit` values defensively. Some APIs use `Math.min(Number(...), 96)` without guarding `NaN` or negative values.
- [ ] Do not swallow database errors silently in core query helpers once production observability exists. Current helpers often return empty arrays on catch, which hides outages as empty content.

### Admin UX

- [x] Add Books and Quotes to `src/components/AdminSidebar.tsx`; dashboard quick links exist, but the persistent sidebar does not expose those sections.
- [ ] Add delete confirmation patterns that are accessible and consistent. Current forms use browser `confirm`.
- [ ] Add optimistic or explicit success states after save/delete.
- [ ] Add field-level validation messages in admin forms instead of only generic errors.
- [ ] Add media previews after upload so admins know exactly what will publish.

### Content Operations

- [x] `prisma/seed.cjs:37-40` deletes quotes, books, messages, and categories before seeding. Keep this dev-only and create a non-destructive production seed/import path.
- [x] `prisma/seed.cjs:254` has a hardcoded fallback admin email. Replace with a neutral failure or required env value.
- [ ] Add export/backup workflow for content before destructive operations.
- [ ] Add editorial states beyond simple publish where needed: draft, review, scheduled, archived.

## P2 Production Maturity

- [ ] Add observability: error reporting, structured server logs, request IDs, and admin audit logs.
- [ ] Add uptime and health checks for app, database, auth, and storage.
- [ ] Add analytics that respect privacy and measure content engagement.
- [ ] Add staging and production environment separation.
- [ ] Add dependency audit once registry access is available.
- [ ] Add release notes and rollback instructions.
- [ ] Add backup restore drill for database and R2 assets.

## Verification Results

Commands run locally:

```powershell
npm run build
```

Result: passed. Next.js compiled successfully, TypeScript completed, and route generation completed.

```powershell
npx tsc --noEmit
```

Result: passed.

```powershell
npx prisma validate
```

Result: passed.

```powershell
npm run lint
```

Result: failed. The script uses `next lint`, which is not valid for this installed Next version.

```powershell
npx prisma migrate status
```

Result: failed with a schema engine error. The migration state still needs target-environment validation.

```powershell
npm audit --omit=dev --json
```

Result: inconclusive. The command could not reach the npm registry from this environment.

Not run:

- `npm run db:seed`, because the seed script deletes existing content before inserting seed records.

## Phased Production Plan

### Phase 0: Stop-The-Bleed Hardening

Goal: remove launch blockers that can cause immediate security, deployment, or data failures.

Checklist:

- [ ] Protect or move upload signing behind admin auth.
- [ ] Fix `.env.example` to match runtime variable names.
- [ ] Replace shared public admin registration with invite/bootstrap flow.
- [ ] Fix lint script and add ESLint config.
- [ ] Resolve Prisma migration status failure.
- [ ] Confirm migration history against a clean database and current database.
- [ ] Add `next.config` for image remote patterns and baseline security headers.
- [ ] Remove hardcoded fallback admin email from seed.
- [ ] Mark seed script as development-only or split into `seed:dev` and `seed:prod-safe`.

Verification:

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `npx tsc --noEmit`
- [ ] `npx prisma validate`
- [ ] `npx prisma migrate status`
- [ ] Anonymous upload route check returns 401.

Exit criteria: no known P0 blockers remain.

### Phase 1: Quality Gates And CI

Goal: create the safety rails expected of a production codebase.

Checklist:

- [ ] Add test runner for unit and route-level tests.
- [ ] Add Playwright for browser smoke tests.
- [ ] Add CI workflow for install, lint, typecheck, unit tests, build, and e2e smoke.
- [ ] Add test database strategy.
- [ ] Add fixtures for messages, books, quotes, contact submissions, and admin user.
- [ ] Add PR checklist requiring proof of verification.

Priority tests:

- [ ] Contact validation rejects spam honeypot, invalid email, too-short message, and oversized message.
- [ ] Upload validation rejects unsupported MIME and oversized files.
- [ ] Admin APIs reject anonymous requests.
- [ ] Public pages show only `PUBLISHED` content.
- [ ] Publishing hero media demotes other published hero records.
- [ ] Books and quotes publish/unpublish correctly.

Exit criteria: no production change ships without passing automated gates.

### Phase 2: Security And Admin Operations

Goal: protect all write paths and make admin actions auditable.

Checklist:

- [ ] Add rate limiting to login, register/invite, contact, and upload URL endpoints.
- [ ] Add admin audit log model.
- [ ] Record content create/update/delete/upload events.
- [ ] Add role model if multiple admin permission levels are expected.
- [ ] Add signed invite token flow for new admins.
- [ ] Add session timeout and explicit re-authentication for dangerous actions.
- [ ] Validate URL fields for safe protocols only.
- [ ] Add malware/media validation or manual approval for uploaded files.
- [ ] Add R2 CORS policy documentation and bucket permission checklist.

Exit criteria: admin writes are authenticated, rate-limited, attributable, and recoverable.

### Phase 3: Data And Content Workflow

Goal: make content reliable to operate after launch.

Checklist:

- [ ] Normalize API response shapes for messages, books, and quotes.
- [ ] Add cursor or page-based pagination.
- [ ] Add admin filters for status, type, availability, featured, and search.
- [ ] Add non-destructive content import/export.
- [ ] Add database backup schedule and restore drill.
- [ ] Add media orphan cleanup job.
- [ ] Add scheduled publish support if ministry content has timed releases.
- [ ] Add canonical slugs and redirect handling when slugs change.

Exit criteria: admins can manage content safely without direct database access.

### Phase 4: Public UX, Accessibility, And SEO

Goal: bring the user-facing product to a polished, accessible launch baseline.

Checklist:

- [ ] Convert home data reads to server-first rendering where practical.
- [ ] Add a mobile navigation drawer or compact menu.
- [ ] Add reduced-motion support to `WelcomeAnimation` and any future motion.
- [ ] Run WCAG 2.2 AA audit for navigation, forms, contrast, focus states, keyboard access, and media controls.
- [ ] Follow Apple and Google HIG principles for touch target size, hierarchy, predictable navigation, and readable states.
- [ ] Add loading, empty, and error states for all public content domains.
- [ ] Add metadata and Open Graph for all major routes.
- [ ] Add sitemap and robots configuration.
- [ ] Add content QA pass for approved ministry wording and no placeholder remnants.

Exit criteria: the public site is usable, polished, accessible, and discoverable on mobile and desktop.

### Phase 5: Media Pipeline And Performance

Goal: make sermons, images, books, and quote media reliable and fast.

Checklist:

- [ ] Define final R2 object naming and bucket policy.
- [ ] Add image optimization workflow for covers and quote images.
- [ ] Add FFmpeg processing workflow for video and audio delivery assets.
- [ ] Store original asset metadata and delivery asset metadata separately.
- [ ] Add upload progress, preview, retry, and failure recovery in admin forms.
- [ ] Add CDN caching rules for public assets.
- [ ] Add Lighthouse performance budget.
- [ ] Test low-bandwidth and mobile playback behavior.

Exit criteria: media delivery is controlled, optimized, and measurable.

### Phase 6: Launch Readiness And Operations

Goal: prepare SAVEMI for a production launch with rollback and support discipline.

Checklist:

- [ ] Create staging environment with production-like database and storage.
- [ ] Run full migration deploy in staging.
- [ ] Run production smoke test checklist.
- [ ] Configure monitoring, error alerts, and uptime checks.
- [ ] Document rollback procedure for app deploy, database migration, and content release.
- [ ] Document admin handbook for messages, books, quotes, uploads, and contacts.
- [ ] Confirm backup schedule and restore procedure.
- [ ] Freeze launch content and run final editorial review.

Exit criteria: launch can proceed with clear owner actions, rollback paths, and monitoring.

## Industry Standard Definition Of Done

For this project, "done" should mean:

- [ ] The change is implemented in the smallest coherent vertical slice.
- [ ] TypeScript passes.
- [ ] Lint passes.
- [ ] Relevant unit/route/e2e tests pass.
- [ ] Security-sensitive paths have negative tests.
- [ ] Accessibility is checked for any UI change.
- [ ] Production env and migration impact are documented.
- [ ] User-facing copy is approved.
- [ ] The work can be rolled back or safely remediated.

This is the practical SWE-Bench-style standard for SAVEMI: every claim must have code evidence, a reproducible check, and a clear pass/fail signal.

## Knowledge Triage

Must know by heart:

- Upload signing, admin writes, and content publishing are production write paths. Protect them first.
- A build passing is not the same as production readiness.
- Seeds that delete content are development tools, not production operations.
- Migration status must be proven against the real target database.
- Public pages should show approved published content only.

Must recognize:

- Next.js version changes can invalidate old scripts like `next lint`.
- External image URLs require Next image configuration.
- Silent catch blocks can hide outages as empty states.
- Shared admin credentials do not scale to accountable operations.
- Client-declared MIME and size checks are not enough for a storage pipeline.

Lookup-only:

- Exact CockroachDB migration SQL syntax for advanced type conversions.
- Current Auth.js v5 beta migration notes.
- Cloudflare R2 CORS and bucket policy details.
- Lighthouse scoring thresholds for the final hosting target.
- Specific WCAG 2.2 test procedures and audit tooling configuration.

## Recommended Immediate Build Order

1. Lock upload signing behind admin auth.
2. Fix environment naming and lint setup.
3. Resolve Prisma migration status and type drift.
4. Replace public shared-code registration with a safer admin bootstrap/invite flow.
5. Add unit tests for validators and route tests for auth protection.
6. Add `next.config` for images and headers.
7. Add mobile nav and reduced-motion support.
8. Add CI.

This order gives the highest risk reduction per hour before deeper frontend polish.
