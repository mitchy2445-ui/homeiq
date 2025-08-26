-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerified" DATETIME;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
