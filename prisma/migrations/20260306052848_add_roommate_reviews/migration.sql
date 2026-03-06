-- CreateTable
CREATE TABLE "RoommateReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewerId" TEXT NOT NULL,
    "reviewedId" TEXT NOT NULL,
    "cleanliness" INTEGER NOT NULL,
    "paymentReliability" INTEGER NOT NULL,
    "noiseLevel" INTEGER NOT NULL,
    "respectfulness" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "wouldLiveAgain" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoommateReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoommateReview_reviewedId_fkey" FOREIGN KEY ("reviewedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RoommateReview_reviewedId_idx" ON "RoommateReview"("reviewedId");
