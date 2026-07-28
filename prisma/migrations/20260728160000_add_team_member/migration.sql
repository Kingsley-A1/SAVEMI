-- Ministry team members shown on the public /team page.

-- Role hierarchy, most senior first. ANCHOR leads the page.
CREATE TYPE "TeamRole" AS ENUM (
    'ANCHOR',
    'PASTOR',
    'ELDER',
    'COORDINATOR',
    'MEDIA',
    'MEMBER'
);

CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "name" STRING NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "title" STRING NOT NULL,
    "bio" STRING,
    "photoKey" STRING,
    "email" STRING,
    "phone" STRING,
    "facebookUrl" STRING,
    "youtubeUrl" STRING,
    "whatsappNumber" STRING,
    "scriptureVerse" STRING,
    "scriptureReference" STRING,
    "sortOrder" INT4 NOT NULL DEFAULT 0,
    "status" "MessageStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT current_timestamp(),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CockroachDB auto-locks newly created tables for changefeed support, which
-- blocks a same-migration index build. Unlock, index, then re-lock.
ALTER TABLE "TeamMember" SET (schema_locked = false);

CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_slug_key" ON "TeamMember" ("slug");
CREATE INDEX IF NOT EXISTS "TeamMember_status_role_sortOrder_idx" ON "TeamMember" ("status", "role", "sortOrder");

ALTER TABLE "TeamMember" SET (schema_locked = true);
