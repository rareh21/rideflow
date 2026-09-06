-- CreateEnum
CREATE TYPE "DriverApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "DriverApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DriverApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "licenseNumber" TEXT,
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverApplication_userId_key" ON "DriverApplication"("userId");

-- CreateIndex
CREATE INDEX "DriverApplication_status_idx" ON "DriverApplication"("status");

-- AddForeignKey
ALTER TABLE "DriverApplication" ADD CONSTRAINT "DriverApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
