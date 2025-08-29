-- CreateTable
CREATE TABLE "LandlordProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneVerifiedAt" DATETIME,
    "dob" DATETIME,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT NOT NULL,
    "postal" TEXT NOT NULL,
    "idStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "kycProvider" TEXT,
    "kycRef" TEXT,
    "addressDocUrl" TEXT,
    "phoneOtpHash" TEXT,
    "phoneOtpExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LandlordProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "beds" INTEGER NOT NULL,
    "baths" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "landlordId" TEXT,
    "images" JSONB,
    "videoUrl" TEXT,
    "propertyType" TEXT,
    "neighborhoodVibe" TEXT,
    "areaType" TEXT,
    "distanceBusMeters" INTEGER,
    "distanceGroceryMeters" INTEGER,
    "distanceSchoolMeters" INTEGER,
    "distanceParkMeters" INTEGER,
    "distancePharmacyMeters" INTEGER,
    "distanceGymMeters" INTEGER,
    "parkingType" TEXT,
    "petPolicy" TEXT,
    "accessibility" JSONB,
    "laundry" TEXT,
    "heating" TEXT,
    "cooling" TEXT,
    "furnished" BOOLEAN,
    "utilitiesIncluded" JSONB,
    "minLeaseMonths" INTEGER,
    "maxOccupants" INTEGER,
    "smokingAllowed" BOOLEAN,
    "houseRules" TEXT,
    "depositCents" INTEGER,
    CONSTRAINT "Listing_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("baths", "beds", "city", "createdAt", "description", "id", "images", "landlordId", "price", "status", "title", "updatedAt", "videoUrl") SELECT "baths", "beds", "city", "createdAt", "description", "id", "images", "landlordId", "price", "status", "title", "updatedAt", "videoUrl" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "LandlordProfile_userId_key" ON "LandlordProfile"("userId");
