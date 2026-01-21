/*
  Warnings:

  - You are about to drop the column `preferredTenantType` on the `Listing` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "landlordId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "houseRules" TEXT,
    "street" TEXT NOT NULL,
    "aptUnit" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postal" TEXT NOT NULL,
    "country" TEXT,
    "price" INTEGER NOT NULL,
    "beds" INTEGER NOT NULL,
    "baths" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
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
    "depositCents" INTEGER,
    "availableFrom" DATETIME,
    "idealRenterSummary" TEXT,
    "petSummary" TEXT,
    "parkingSummary" TEXT,
    "laundrySummary" TEXT,
    "noiseLevel" TEXT,
    "naturalLight" TEXT,
    "interiorNotes" TEXT,
    "buildingAmenitiesNotes" TEXT,
    "rulesNotes" TEXT,
    "neighborhoodNotes" TEXT,
    "transit" TEXT,
    "amenities" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Listing_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("accessibility", "amenities", "aptUnit", "areaType", "availableFrom", "baths", "beds", "buildingAmenitiesNotes", "city", "cooling", "country", "createdAt", "depositCents", "description", "distanceBusMeters", "distanceGroceryMeters", "distanceGymMeters", "distanceParkMeters", "distancePharmacyMeters", "distanceSchoolMeters", "furnished", "heating", "houseRules", "id", "idealRenterSummary", "images", "interiorNotes", "landlordId", "laundry", "laundrySummary", "maxOccupants", "minLeaseMonths", "naturalLight", "neighborhoodNotes", "neighborhoodVibe", "noiseLevel", "parkingSummary", "parkingType", "petPolicy", "petSummary", "postal", "price", "propertyType", "province", "rulesNotes", "smokingAllowed", "status", "street", "title", "transit", "updatedAt", "utilitiesIncluded", "videoUrl", "videos") SELECT "accessibility", "amenities", "aptUnit", "areaType", "availableFrom", "baths", "beds", "buildingAmenitiesNotes", "city", "cooling", "country", "createdAt", "depositCents", "description", "distanceBusMeters", "distanceGroceryMeters", "distanceGymMeters", "distanceParkMeters", "distancePharmacyMeters", "distanceSchoolMeters", "furnished", "heating", "houseRules", "id", "idealRenterSummary", "images", "interiorNotes", "landlordId", "laundry", "laundrySummary", "maxOccupants", "minLeaseMonths", "naturalLight", "neighborhoodNotes", "neighborhoodVibe", "noiseLevel", "parkingSummary", "parkingType", "petPolicy", "petSummary", "postal", "price", "propertyType", "province", "rulesNotes", "smokingAllowed", "status", "street", "title", "transit", "updatedAt", "utilitiesIncluded", "videoUrl", "videos" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
