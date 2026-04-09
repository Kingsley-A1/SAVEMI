# SAVEMI Website Smart Delivery Plan

## 1. Purpose

This document replaces the earlier broad architecture note with a practical delivery plan for the current SAVEMI website codebase. The goal is to move quickly, keep implementation quality high, and ship in phases that are easy to execute, review, and verify.

The product direction is clear:

- Build a professional, mobile-first ministry website for SAVEMI.
- Align the visual language to the supplied logo and logo background.
- Keep the palette simple: deep green, warm white, soft cream, and restrained gradients.
- Preserve the brand line exactly as shown in the logo context: **Repose | Renewal | Restoration**.
- Ship the smallest solid foundation first, then layer in data, APIs, media, and polish.

## 1A. Implementation Status

- Phase 1 baseline is implemented in the current codebase.
- Phase 2 baseline is implemented in the current codebase.
- Phase 3 baseline is implemented in the current codebase.
- The next delivery target is Phase 4: Components, followed by frontend refinement and polish.

## 2. Codebase Review Summary

The current repository is a usable scaffold, not yet a production-ready platform.

### What exists now

- Next.js App Router structure is present.
- Core public pages exist: home, about, contact, messages, message detail.
- Shared layout, navbar, and footer have been refactored into a branded mobile-first shell.
- Brand tokens, setup config, environment examples, and local project scripts are in place.
- Prisma schema, initial migration, and seed data are present.
- Message queries now read from the database layer rather than from hardcoded arrays.
- Public API routes now exist for messages, single-message lookup, contact submissions, and upload URL generation.
- Contact submissions now validate and persist when the database is configured.
- Cloudflare R2 signed URL helpers and upload validation are now implemented.
- Logo assets exist in `public/images/`.

### Main gaps identified

- No admin upload surface exists yet.
- Compression strategy is defined and handed off in the upload API, but actual media processing is not automated yet.
- The remaining work is now concentrated in shared components, frontend refinement, and final polish.

### Delivery implication

The correct approach is not to add features randomly. The work should proceed in controlled phases so that branding, structure, data, media, and UX mature together.

## 3. Delivery Principles

These principles apply to every phase:

1. **Mobile first**: Design for small screens first, then scale up.
2. **Brand first**: Every public page must look visibly tied to the SAVEMI logo background and ministry tone.
3. **Keep the stack lean**: Do not introduce state tools or abstractions unless the phase truly needs them.
4. **Server-first where possible**: Use Next.js server rendering and route handlers for initial public data flows.
5. **Accessible by default**: Clear contrast, semantic structure, keyboard access, and legible type.
6. **Performance-conscious**: Optimize images, media delivery, and payload size from the start.
7. **Professional finish**: Clean spacing, consistent components, clear loading and error states, no placeholder-looking UI.

## 4. Brand and Styling Direction

The design system should be derived from the provided logo and background image rather than from generic Tailwind defaults.

### Visual direction

- Primary tone: deep forest green.
- Secondary tone: softened green gradient for panels and hero surfaces.
- Accent tone: warm cream/off-white inspired by the logo mark.
- Neutral tone: white and light warm surfaces for content readability.
- Visual mood: calm, reflective, elegant, restrained, spiritual.

### Recommended design tokens

- `brand.primary`: deep green, used for hero backgrounds, buttons, overlays, and section dividers.
- `brand.primarySoft`: muted green gradient for cards and surface variation.
- `brand.accent`: warm cream for highlights, key text, dividers, and icon accents.
- `brand.surface`: white or near-white for readable content blocks.
- `brand.text`: dark green-charcoal for readable body text on light surfaces.

### UI styling rules

- Use simple gradients, not loud or saturated effects.
- Use rounded shapes selectively and consistently.
- Use soft shadows and subtle blur only where they reinforce the brand background style.
- Keep typography calm and refined.
- Keep buttons, cards, and sections visually consistent across pages.
- Use the tagline **Repose | Renewal | Restoration** in the hero and key brand surfaces exactly as written.

## 5. Phased Delivery Plan

## Phase 1: Setup

### Status

Completed as a baseline implementation in the current codebase.

### Objective

Stabilize the project foundation so later work is fast, consistent, and low-risk.

### Scope

- Standardize naming to **SAVEMI** across copy, metadata, docs, and components.
- Audit and confirm the minimum package set actually needed for the first release.
- Establish project conventions for structure, naming, styling tokens, and environment variables.
- Set up base design tokens and global styles around the brand palette.
- Confirm local development workflow and deployment assumptions.

### Work items

- Review `package.json` and remove or postpone unused complexity if not needed immediately.
- Create or update `.env.example` for database, storage, and optional auth values.
- Define color variables, spacing rhythm, and shared utility conventions in global styles.
- Confirm canonical asset usage for logo and logo background.
- Update metadata and base layout copy to match SAVEMI branding.
- Add a simple documentation section for local setup and environment expectations.

### Acceptance criteria

- The app runs locally without ambiguity about required environment variables.
- Naming is consistent as **SAVEMI** in user-facing copy and docs.
- Base styles expose reusable brand tokens for green, white, cream, and gradients.
- Layout and metadata reflect the ministry brand and tagline direction.
- Team members can identify where setup, design tokens, and environment config live.

## Phase 2: Database

### Status

Completed as a baseline implementation in the current codebase.

### Objective

Replace the dummy content foundation with a clean, scalable content model.

### Scope

- Create the initial Prisma schema.
- Define the minimum content entities needed for launch.
- Support future media management without over-modeling too early.

### Recommended initial models

- `Message`
- `Category`
- `Speaker` or speaker fields on `Message`
- `ContactSubmission`
- Optional `AdminUser` only if auth is introduced in the same milestone

### Required `Message` fields

- id
- slug
- title
- summary
- description or transcript excerpt
- type: video, audio, image, article-style reflection if needed
- speaker
- scripture reference
- event date
- publish status
- cover image key
- media object key
- duration for audio or video where relevant
- created at
- updated at

### Work items

- Add Prisma schema and client generation.
- Create initial migration.
- Add seed data for local development.
- Create typed query helpers in `src/lib` for public reads and admin writes.
- Define slug strategy and ordering strategy for recent messages.

### Acceptance criteria

- Local database setup works end-to-end.
- The schema supports messages, categories, and contact submissions.
- Seed data can power the public pages without fallback to hardcoded arrays.
- Query helpers are typed and reusable by route handlers and pages.
- The data model supports current pages without needing breaking redesign.

## Phase 3: Backend and API

### Status

Completed as a baseline implementation in the current codebase.

### Objective

Build the server-side workflows that power real content delivery and content management.

### Scope

- Public read APIs or direct server queries for messages.
- Contact submission handling.
- Admin upload and content creation flow.
- Cloudflare R2 signed URL flow.
- Media compression strategy before storage or at upload processing time.

### Core backend responsibilities

- Fetch paginated messages.
- Fetch message details by slug or id.
- Filter by category, type, speaker, or search term.
- Accept contact form submissions safely.
- Generate signed upload URLs for media.
- Persist uploaded media metadata.
- Generate signed read URLs for protected or controlled asset access.

### Compression and media handling

- Images: optimize through Next.js image handling and `sharp` where server-side processing is needed.
- Video/audio: define a lightweight compression path using FFmpeg in an admin workflow or pre-processing step before final storage.
- Store both original metadata and delivery-ready file references where useful.

### Guardrails

- Validate all payloads.
- Add server-side error handling.
- Add basic rate limiting or anti-abuse protection on public forms and admin-sensitive endpoints.
- Keep public APIs read-only and simple.

### Acceptance criteria

- Message list and message detail can be powered by real server data.
- Contact submissions are stored or sent through a confirmed workflow.
- Upload flow can create a media record and store the asset in R2.
- Signed URLs work for upload and delivery.
- Invalid requests return safe, structured errors.
- Media handling strategy is documented and not left as a placeholder.

## Phase 4: Components

### Objective

Create a reusable component system that supports a polished brand experience without duplicated markup.

### Scope

- Navigation
- Footer
- Hero section
- Section wrapper
- Message card
- Featured message card
- Media player surface
- Contact form UI
- Buttons, badges, pills, inputs, textareas, empty states, and loading states

### Component rules

- Components should be visually consistent across pages.
- Mobile-first spacing and responsive behavior should be built into each component.
- Every component should support the green/cream/white brand palette.
- Components should handle hover, focus, active, loading, and disabled states where applicable.

### Priority component list

1. Responsive navbar with mobile menu.
2. Branded footer with quick links and ministry line.
3. Hero block using the logo background style.
4. Message card system for list, featured, and compact variants.
5. Media display wrapper for video, audio, and image content.
6. Form field system for contact and admin workflows.

### Acceptance criteria

- Shared UI elements are componentized and reused across the app.
- Navigation works cleanly on small screens and large screens.
- Components express a coherent SAVEMI visual identity.
- Interactive states are complete and accessible.
- Pages no longer rely on generic one-off Tailwind styling blocks.

## Phase 5: Frontend

### Objective

Deliver the public-facing experience with clear messaging, strong brand alignment, and real content flows.

### Scope by page

#### Home

- Branded hero using the logo background mood.
- Tagline: **Repose | Renewal | Restoration**.
- Intro to the ministry.
- Featured or recent messages.
- Clear call to action into the messages library.

#### Messages index

- Filterable list.
- Search or quick category filters.
- Strong mobile card layout.
- Empty state and loading state.

#### Message detail

- Elegant title block.
- Media playback or display.
- Message summary and supporting metadata.
- Download or listen/watch action.
- Related or next message section.

#### About

- Mission, history, and ministry identity.
- Calm, editorial layout rather than plain text blocks.

#### Contact

- Real submission flow.
- Clear success, validation, and failure states.
- Optional prayer request framing if this aligns with ministry goals.

#### Optional early admin surface

- Keep this minimal for the first pass.
- Upload form, metadata entry, and submission confirmation only.

### Frontend quality expectations

- Every page must feel intentionally designed, not scaffolded.
- Spacing, alignment, and copy hierarchy must be consistent.
- The visual language must remain calm and minimal.
- Responsive behavior must be designed from mobile upward.

### Acceptance criteria

- All public pages are functional and visually aligned with the SAVEMI identity.
- The home page clearly communicates ministry purpose and directs users into content.
- Messages pages work with real data and real media states.
- Contact flow works from form entry to successful submission feedback.
- The UI looks polished on mobile, tablet, and desktop.

## Phase 6: Polish

### Objective

Raise the product from functional to launch-ready.

### Scope

- Accessibility pass.
- Performance pass.
- Metadata and SEO pass.
- Content QA.
- Cross-device QA.
- Empty, error, and offline-adjacent state review.

### Polish checklist

- Replace remaining placeholder copy.
- Audit contrast and focus visibility.
- Optimize imagery and media previews.
- Add Open Graph metadata and page metadata.
- Review layout rhythm, visual balance, and section transitions.
- Confirm all user flows have success and failure handling.
- Check keyboard navigation and screen-reader semantics.
- Confirm no page visually breaks below common mobile widths.

### Acceptance criteria

- Lighthouse-style concerns are addressed to an acceptable production baseline.
- Accessibility issues are resolved for navigation, forms, media, and color contrast.
- Metadata is present for key pages.
- No page feels unfinished, inconsistent, or visibly placeholder-driven.
- The product is ready for stakeholder review or soft launch.

## 6. Fast-Track Execution Order

To keep development fast and efficient, the recommended implementation order is:

1. Phase 1 Setup
2. Phase 4 Components foundation in parallel with Phase 1 styling tokens
3. Phase 2 Database
4. Phase 3 Backend and API
5. Phase 5 Frontend integration with real data
6. Phase 6 Polish

This order avoids building branded frontend pages on top of unstable data or placeholder systems.

## 7. Definition of Done for V1

Version 1 should be considered complete when all of the following are true:

- SAVEMI branding is consistent across the product.
- The site is mobile-first and visually polished.
- The home, about, messages, message detail, and contact pages are production-ready.
- Content is served from a real database-backed workflow.
- Media storage and delivery work through Cloudflare R2.
- Contact submissions are handled safely.
- Shared components are reusable and consistent.
- Basic launch quality checks for accessibility, responsiveness, and performance are complete.

## 8. Immediate Next Build Target

The next implementation target should be Phase 4 and Phase 5 refinement:

- componentize the remaining shared UI surfaces beyond the shell
- add message card, featured content, and media presentation components
- refine the public pages around real API-driven states
- keep the mobile-first presentation consistent with the SAVEMI brand system

This shifts the project from infrastructure delivery into reusable UI and production-facing experience work.
