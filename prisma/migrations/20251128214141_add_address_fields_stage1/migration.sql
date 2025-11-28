-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "aptUnit" TEXT;
ALTER TABLE "Listing" ADD COLUMN "country" TEXT DEFAULT 'Canada';
ALTER TABLE "Listing" ADD COLUMN "postal" TEXT;
ALTER TABLE "Listing" ADD COLUMN "province" TEXT;
ALTER TABLE "Listing" ADD COLUMN "street" TEXT;
