-- Owner-editable site settings (contacts, social handles).
CREATE TABLE IF NOT EXISTS "SiteSetting" (
    "key" STRING NOT NULL,
    "value" STRING NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" STRING,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- Books uploaded straight from the admin's device are stored in R2; the
-- external download link stays optional.
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "downloadKey" STRING;
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "downloadFileName" STRING;
