-- Move admin email verification from a link to a 6-digit code, and add
-- password reset codes for public members.
--
-- Codes are stored as bcrypt hashes with an expiry and a wrong-guess counter:
-- six digits is only a million guesses, so it must never sit in the clear and
-- must die after a handful of attempts.

ALTER TABLE "AdminUser" SET (schema_locked = false);

-- The old link flow looked admins up BY token, which required uniqueness.
-- The code flow looks up by email and then compares the hash, so the unique
-- constraint is no longer meaningful (and salted hashes never collide).
DROP INDEX IF EXISTS "AdminUser_verifyToken_key" CASCADE;

ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "verifyAttempts" INT4 NOT NULL DEFAULT 0;

-- Any link-era token is unusable under the new scheme; clear it so nobody is
-- left holding a token that can never verify. Admins already verified are
-- untouched; unverified admins request a fresh code.
UPDATE "AdminUser"
   SET "verifyToken" = NULL,
       "verifyTokenExpiry" = NULL
 WHERE "verifyToken" IS NOT NULL;

ALTER TABLE "AdminUser" SET (schema_locked = true);

ALTER TABLE "SiteUser" SET (schema_locked = false);

ALTER TABLE "SiteUser" ADD COLUMN IF NOT EXISTS "resetCodeHash" STRING;
ALTER TABLE "SiteUser" ADD COLUMN IF NOT EXISTS "resetCodeExpiry" TIMESTAMP(3);
ALTER TABLE "SiteUser" ADD COLUMN IF NOT EXISTS "resetAttempts" INT4 NOT NULL DEFAULT 0;

ALTER TABLE "SiteUser" SET (schema_locked = true);
