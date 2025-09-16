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
    "videos" JSONB,
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
    "locationVerified" BOOLEAN NOT NULL DEFAULT false,
    "insights" JSONB,
    CONSTRAINT "Listing_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("accessibility", "areaType", "baths", "beds", "city", "cooling", "createdAt", "depositCents", "description", "distanceBusMeters", "distanceGroceryMeters", "distanceGymMeters", "distanceParkMeters", "distancePharmacyMeters", "distanceSchoolMeters", "furnished", "heating", "houseRules", "id", "images", "landlordId", "laundry", "maxOccupants", "minLeaseMonths", "neighborhoodVibe", "parkingType", "petPolicy", "price", "propertyType", "smokingAllowed", "status", "title", "updatedAt", "utilitiesIncluded", "videoUrl", "videos") SELECT "accessibility", "areaType", "baths", "beds", "city", "cooling", "createdAt", "depositCents", "description", "distanceBusMeters", "distanceGroceryMeters", "distanceGymMeters", "distanceParkMeters", "distancePharmacyMeters", "distanceSchoolMeters", "furnished", "heating", "houseRules", "id", "images", "landlordId", "laundry", "maxOccupants", "minLeaseMonths", "neighborhoodVibe", "parkingType", "petPolicy", "price", "propertyType", "smokingAllowed", "status", "title", "updatedAt", "utilitiesIncluded", "videoUrl", "videos" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "emailVerified" DATETIME,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" DATETIME,
    "phoneVerifiedAt" DATETIME,
    "emailVerifiedAt" DATETIME,
    "idCheckProvider" TEXT,
    "idCheckSessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "name", "passwordHash", "role", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "name", "passwordHash", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
