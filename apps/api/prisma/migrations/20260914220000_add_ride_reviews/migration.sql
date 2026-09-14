-- CreateTable
CREATE TABLE "RideReview" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RideReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RideReview_reviewerId_idx" ON "RideReview"("reviewerId");

-- CreateIndex
CREATE INDEX "RideReview_revieweeId_idx" ON "RideReview"("revieweeId");

-- CreateIndex
CREATE INDEX "RideReview_rideId_idx" ON "RideReview"("rideId");

-- CreateIndex
CREATE UNIQUE INDEX "RideReview_rideId_reviewerId_key" ON "RideReview"("rideId", "reviewerId");

-- AddForeignKey
ALTER TABLE "RideReview" ADD CONSTRAINT "RideReview_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideReview" ADD CONSTRAINT "RideReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideReview" ADD CONSTRAINT "RideReview_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
