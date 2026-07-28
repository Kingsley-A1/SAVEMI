-- History of ministry emails composed and sent by an admin, so admins can
-- review or remove past sends from Admin -> Compose Email.
CREATE TABLE IF NOT EXISTS "SentEmail" (
    "id" STRING NOT NULL,
    "subject" STRING NOT NULL,
    "bodyText" STRING NOT NULL,
    "scriptureVerse" STRING,
    "scriptureReference" STRING,
    "recipients" STRING[] NOT NULL,
    "sentCount" INT4 NOT NULL,
    "failedCount" INT4 NOT NULL DEFAULT 0,
    "sentByEmail" STRING NOT NULL,
    "sentByName" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT current_timestamp(),

    CONSTRAINT "SentEmail_pkey" PRIMARY KEY ("id")
);

-- CockroachDB auto-locks newly created tables for changefeed support, which
-- blocks a same-migration CREATE INDEX. Unlock, index, then re-lock.
ALTER TABLE "SentEmail" SET (schema_locked = false);
CREATE INDEX IF NOT EXISTS "SentEmail_createdAt_idx" ON "SentEmail" ("createdAt");
ALTER TABLE "SentEmail" SET (schema_locked = true);
