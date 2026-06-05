# SAVEMI Strategic Rollout: Real Content, Books, and Quotes

## 1. Objective

This initiative moves SAVEMI from placeholder content to a real ministry content platform. The immediate target is to align the website with verified ministry information, establish first-class data models for books and quotes, and prepare a controlled rollout for complete public and admin support.

## 2. Business Outcomes

- Replace incorrect ministry copy with verified SAVEMI information.
- Remove visible placeholder content from the public experience.
- Introduce `Book` and `Quote` as first-class content domains.
- Support both free book downloads and paid-book redirect flows.
- Support quote image viewing and future quote gallery presentation.
- Give admin users full CRUD control over messages, books, and quotes.

## 3. Scope

### In this execution slice

- Update the public site with verified SAVEMI information.
- Add Prisma schema support for books and quotes.
- Seed real SAVEMI-oriented messages, free Christian books, and quote records.
- Run the database migration and reseed the platform.
- Replace home-page placeholder feature blocks with live message reads.

### In the next implementation slice

- Public `/books` listing page.
- Public `/books/[slug]` PDP.
- Public `/quotes` gallery page.
- Public `/quotes/[slug]` detail or modal image view pattern.
- Admin `/admin/books` CRUD.
- Admin `/admin/quotes` CRUD.
- Admin upload support for book covers, downloadable files, and quote images.

## 4. Product Requirements

### Books

- Listing card must show title, tagline, author, and `Free` or price tag.
- PDP must show full description, metadata, CTA, and cover image.
- Free book: CTA opens download/resource URL.
- Paid book: CTA redirects to external sales platform.
- Admin must control title, slug, tagline, author, description, price label, availability, asset URLs, featured flag, and publish state.

### Quotes

- Listing/gallery must show quote title, attribution, and image preview.
- Quote image must be viewable at user level.
- Admin must control quote copy, attribution, scripture reference, image, featured flag, and publish state.

### Ministry Information

- Home and About pages must reflect verified SAVEMI identity.
- Official Facebook page and video archive must be surfaced directly.
- Copy must reflect Calabar, Nigeria, Pastor Odor Victor T., Sabbath teaching focus, and Reflection at Eventide.

## 5. Technical Design

### Data model

- `Message`: retained for sermons, reflections, audio, and image media.
- `Book`: new model for book merchandising and download flows.
- `Quote`: new model for visual quote content.
- `BookAvailability`: enum with `FREE` and `PAID`.
- Existing `MessageStatus` is reused for publish workflow parity.

### API strategy

- Keep public reads simple and server-first.
- Create public endpoints for books and quotes after admin write routes are in place.
- Mirror the existing admin message route pattern for books and quotes to keep auth and validation consistent.

### Media strategy

- Book cover images and quote images should use the current asset pipeline.
- Free books may begin as external canonical resource links.
- Paid books should store external purchase links.
- Later phase: support admin-uploaded files and controlled delivery URLs.

## 6. SDLC Execution Plan

### Phase 1: Discovery and Content Audit

- Verify all public ministry copy against approved source material.
- Inventory every remaining placeholder text, image, and media dependency.
- Confirm which current messages have usable media assets versus metadata only.

### Phase 2: Data Foundation

- Add Prisma models for books and quotes.
- Generate and apply migration.
- Replace seed mocks with verified ministry-oriented data.
- Validate Prisma client generation and seed execution.

### Phase 3: Public Experience

- Build `/books` and `/books/[slug]`.
- Build `/quotes` gallery and detail/image view.
- Add navigation entries when routes are live.
- Reuse the current visual system to preserve brand consistency.

### Phase 4: Admin CRUD

- Build admin list pages for books and quotes.
- Build create/edit forms.
- Add route handlers for create, update, delete, and publish state transitions.
- Extend dashboard stats and quick actions.

### Phase 5: QA and Editorial Workflow

- Verify free-book CTA behavior.
- Verify paid-book redirect behavior.
- Verify quote image rendering on mobile and desktop.
- Verify publish-state filtering between public and admin surfaces.
- Regression test messages, media upload, contact flow, and auth-protected admin routes.

### Phase 6: Deployment and Operations

- Run migration in the target environment.
- Seed approved launch content.
- Smoke test production routes.
- Hand over a content operations checklist for future uploads and editorial updates.

## 7. Acceptance Criteria

- No visible hardcoded demo records remain on the home page.
- Home and About pages reflect verified SAVEMI information.
- Database schema supports books and quotes with publish workflow.
- Seed populates real SAVEMI-oriented messages, books, and quotes.
- Migration applies cleanly in the configured environment.
- Next implementation phase can begin public and admin CRUD without reworking the schema.

## 8. Risks and Controls

- Risk: book download links may start as external canonical resource pages rather than uploaded files.
  Control: support both external resource URLs now and uploaded files in the admin media phase.
- Risk: not every SAVEMI message currently has a web-ready media file.
  Control: seed verified metadata now and phase in richer media assets through admin upload.
- Risk: books and quotes can drift from ministry voice without editorial review.
  Control: keep publish states and featured flags under admin control.

## 9. Recommended Next Build Order

1. Implement `src/lib/books.ts` and `src/lib/quotes.ts` query helpers.
2. Add public `/books` and `/quotes` routes.
3. Add admin CRUD pages and route handlers.
4. Add upload support for covers, files, and quote images.
5. Add dashboard metrics and editorial QA pass.
