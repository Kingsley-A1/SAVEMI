-- Admin email verification support.
ALTER TABLE "AdminUser" ADD COLUMN "emailVerified" TIMESTAMP(3);
ALTER TABLE "AdminUser" ADD COLUMN "verifyToken" STRING;
ALTER TABLE "AdminUser" ADD COLUMN "verifyTokenExpiry" TIMESTAMP(3);

-- Backfill existing admins as already verified so no current admin is locked out.
UPDATE "AdminUser" SET "emailVerified" = CURRENT_TIMESTAMP WHERE "emailVerified" IS NULL;

CREATE UNIQUE INDEX "AdminUser_verifyToken_key" ON "AdminUser"("verifyToken");
