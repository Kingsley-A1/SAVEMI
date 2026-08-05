-- The Books section becomes Resources, with four typed sub-sections.
-- Every existing Book row defaults to BOOK so nothing already published
-- changes section on its own.
CREATE TYPE "ResourceType" AS ENUM ('BOOK', 'DEVOTIONAL', 'PULPIT', 'ARTICLE');

ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "resourceType" "ResourceType" NOT NULL DEFAULT 'BOOK';

CREATE INDEX IF NOT EXISTS "Book_resourceType_status_publishedAt_idx" ON "Book" ("resourceType", "status", "publishedAt");
