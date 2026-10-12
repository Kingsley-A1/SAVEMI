-- Passwordless sign-in codes, comments, likes, reports, and first-party
-- engagement analytics.

CREATE TYPE "TargetKind" AS ENUM ('MESSAGE', 'RESOURCE', 'QUOTE', 'COMMENT');
CREATE TYPE "CommentStatus" AS ENUM ('VISIBLE', 'HELD', 'HIDDEN');
CREATE TYPE "EngagementType" AS ENUM ('VIEW', 'PLAY', 'DOWNLOAD', 'LIKE', 'COMMENT');

CREATE TABLE IF NOT EXISTS "EmailCode" (
    "email" STRING NOT NULL,
    "name" STRING,
    "codeHash" STRING NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INT4 NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT current_timestamp(),

    CONSTRAINT "EmailCode_pkey" PRIMARY KEY ("email")
);

CREATE TABLE IF NOT EXISTS "Comment" (
    "id" STRING NOT NULL,
    "targetKind" "TargetKind" NOT NULL,
    "targetId" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "parentId" STRING,
    "body" STRING NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'VISIBLE',
    "heldReason" STRING,
    "reportCount" INT4 NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT current_timestamp(),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommentReport" (
    "commentId" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT current_timestamp(),

    CONSTRAINT "CommentReport_pkey" PRIMARY KEY ("commentId", "userId")
);

CREATE TABLE IF NOT EXISTS "Like" (
    "id" STRING NOT NULL,
    "targetKind" "TargetKind" NOT NULL,
    "targetId" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT current_timestamp(),

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EngagementEvent" (
    "id" STRING NOT NULL,
    "type" "EngagementType" NOT NULL,
    "targetKind" "TargetKind",
    "targetId" STRING,
    "path" STRING,
    "userId" STRING,
    "visitorId" STRING NOT NULL,
    "country" STRING,
    "device" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT current_timestamp(),

    CONSTRAINT "EngagementEvent_pkey" PRIMARY KEY ("id")
);

-- CockroachDB auto-locks newly created tables for changefeed support, which
-- blocks a same-migration index build. Unlock, index, then re-lock.
ALTER TABLE "Comment" SET (schema_locked = false);
ALTER TABLE "CommentReport" SET (schema_locked = false);
ALTER TABLE "Like" SET (schema_locked = false);
ALTER TABLE "EngagementEvent" SET (schema_locked = false);

CREATE INDEX IF NOT EXISTS "Comment_targetKind_targetId_status_createdAt_idx" ON "Comment" ("targetKind", "targetId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Comment_status_createdAt_idx" ON "Comment" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Comment_userId_createdAt_idx" ON "Comment" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Comment_parentId_idx" ON "Comment" ("parentId");

CREATE UNIQUE INDEX IF NOT EXISTS "Like_targetKind_targetId_userId_key" ON "Like" ("targetKind", "targetId", "userId");
CREATE INDEX IF NOT EXISTS "Like_targetKind_targetId_idx" ON "Like" ("targetKind", "targetId");
CREATE INDEX IF NOT EXISTS "Like_userId_createdAt_idx" ON "Like" ("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "EngagementEvent_createdAt_idx" ON "EngagementEvent" ("createdAt");
CREATE INDEX IF NOT EXISTS "EngagementEvent_type_createdAt_idx" ON "EngagementEvent" ("type", "createdAt");
CREATE INDEX IF NOT EXISTS "EngagementEvent_targetKind_targetId_type_idx" ON "EngagementEvent" ("targetKind", "targetId", "type");
CREATE INDEX IF NOT EXISTS "EngagementEvent_userId_createdAt_idx" ON "EngagementEvent" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "EngagementEvent_visitorId_createdAt_idx" ON "EngagementEvent" ("visitorId", "createdAt");

-- Foreign keys also write a back-reference onto SiteUser's descriptor.
ALTER TABLE "SiteUser" SET (schema_locked = false);

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SiteUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentReport" ADD CONSTRAINT "CommentReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentReport" ADD CONSTRAINT "CommentReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SiteUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SiteUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SiteUser" SET (schema_locked = true);
ALTER TABLE "Comment" SET (schema_locked = true);
ALTER TABLE "CommentReport" SET (schema_locked = true);
ALTER TABLE "Like" SET (schema_locked = true);
ALTER TABLE "EngagementEvent" SET (schema_locked = true);
