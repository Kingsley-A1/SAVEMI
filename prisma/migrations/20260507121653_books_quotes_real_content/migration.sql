-- CreateEnum
CREATE TYPE "BookAvailability" AS ENUM ('FREE', 'PAID');

-- CreateTable
CREATE TABLE "Book" (
    "id" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "title" STRING NOT NULL,
    "tagline" STRING NOT NULL,
    "description" STRING NOT NULL,
    "author" STRING NOT NULL,
    "coverImageKey" STRING,
    "downloadUrl" STRING,
    "purchaseUrl" STRING,
    "priceLabel" STRING,
    "format" STRING,
    "pageCount" INT4,
    "featured" BOOL NOT NULL DEFAULT false,
    "availability" "BookAvailability" NOT NULL DEFAULT 'FREE',
    "status" "MessageStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "title" STRING NOT NULL,
    "text" STRING NOT NULL,
    "attribution" STRING,
    "source" STRING,
    "scriptureReference" STRING,
    "imageKey" STRING,
    "featured" BOOL NOT NULL DEFAULT false,
    "status" "MessageStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_slug_key" ON "Book"("slug");

-- CreateIndex
CREATE INDEX "Book_status_publishedAt_idx" ON "Book"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Book_availability_idx" ON "Book"("availability");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_slug_key" ON "Quote"("slug");

-- CreateIndex
CREATE INDEX "Quote_status_publishedAt_idx" ON "Quote"("status", "publishedAt");
