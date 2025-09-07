-- CreateTable
CREATE TABLE "ViewingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "note" TEXT,
    "slot1Start" DATETIME,
    "slot1End" DATETIME,
    "slot2Start" DATETIME,
    "slot2End" DATETIME,
    "slot3Start" DATETIME,
    "slot3End" DATETIME,
    "chosenStart" DATETIME,
    "chosenEnd" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ViewingRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViewingRequest_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViewingRequest_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ViewingRequest_landlordId_status_createdAt_idx" ON "ViewingRequest"("landlordId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ViewingRequest_renterId_createdAt_idx" ON "ViewingRequest"("renterId", "createdAt");
