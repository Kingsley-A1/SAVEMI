-- Public site members. Separate from AdminUser: personal bcrypt password,
-- no admin rights, and no access to the admin office.

CREATE TYPE "SiteUserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

CREATE TABLE IF NOT EXISTS "SiteUser" (
    "id" STRING NOT NULL,
    "email" STRING NOT NULL,
    "passwordHash" STRING NOT NULL,
    "name" STRING NOT NULL,
    "status" "SiteUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT current_timestamp(),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteUser_pkey" PRIMARY KEY ("id")
);

-- CockroachDB auto-locks newly created tables for changefeed support, which
-- blocks a same-migration index build. Unlock, index, then re-lock.
ALTER TABLE "SiteUser" SET (schema_locked = false);

CREATE UNIQUE INDEX IF NOT EXISTS "SiteUser_email_key" ON "SiteUser" ("email");
CREATE INDEX IF NOT EXISTS "SiteUser_createdAt_idx" ON "SiteUser" ("createdAt");

ALTER TABLE "SiteUser" SET (schema_locked = true);
