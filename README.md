# SAVEMI Ministry Website

This repository contains the source code and documentation for the **SAVEMI Ministry Website**. The goal of this project is to provide a professional, mobile-first platform for the Sabbath Vesper Ministry to distribute sermons and devotional content through video, audio, and image-based messages.

## Repository Structure

```
avemi-website/
├── public/               # Public assets served by Next.js
│   └── images/           # Logos and other static images
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout (header/footer, metadata)
│   │   ├── page.tsx      # Landing page
│   │   ├── messages/     # Messages listing and detail pages
│   │   │   ├── page.tsx  # List of sermons
│   │   │   └── [id]/
│   │   │       └── page.tsx # Sermon detail page
│   │   ├── about/page.tsx # About page (mission & vision)
│   │   └── contact/page.tsx # Contact form
│   ├── components/       # Reusable React components (Navbar, Footer)
│   ├── lib/              # Utilities (DB access, message queries, R2 helpers)
│   └── styles/           # Global and component styles (Tailwind)
├── docs/
│   └── plan.md           # Delivery plan and phase tracking
├── logos/
│   ├── logo.jpg          # Primary logo
│   └── logo_background.jpg # Alternate background
├── prisma/               # Prisma schema, migration, and seed files
├── package.json          # Project dependencies and scripts
└── tsconfig.json         # TypeScript and path alias configuration
```

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and fill in database and storage values.
3. Run `npm run db:generate` after dependencies are installed.
4. Run `npm run dev` to start the local app.

## Current Status

- Phase 1 setup and branding foundation is implemented.
- Phase 2 database foundation is implemented through Prisma schema, migration, seed data, and message queries.
- Phase 3 backend and API foundation is implemented through route handlers, contact submission persistence, request validation, and Cloudflare R2 signed URL helpers.

See `docs/plan.md` for the active delivery plan and acceptance criteria.
