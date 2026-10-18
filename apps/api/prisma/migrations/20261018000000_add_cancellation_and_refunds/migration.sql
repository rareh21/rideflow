-- CreateEnum
CREATE TYPE "CancellationReason" AS ENUM ('DRIVER_TAKING_TOO_LONG', 'CHANGE_OF_PLANS', 'WRONG_PICKUP_LOCATION', 'FOUND_ALTERNATIVE', 'PRICE_TOO_HIGH', 'ACCIDENTAL_REQUEST', 'DRIVER_UNAVAILABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "cancellationNote" TEXT,
ADD COLUMN     "cancellationReason" "CancellationReason",
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledById" TEXT;

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "provider" TEXT,
    "providerRefundId" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundJob" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "RefundJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Refund_paymentId_key" ON "Refund"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_rideId_key" ON "Refund"("rideId");

-- CreateIndex
CREATE INDEX "Refund_userId_idx" ON "Refund"("userId");

-- CreateIndex
CREATE INDEX "Refund_status_idx" ON "Refund"("status");

-- CreateIndex
CREATE INDEX "Refund_rideId_idx" ON "Refund"("rideId");

-- CreateIndex
CREATE UNIQUE INDEX "RefundJob_refundId_key" ON "RefundJob"("refundId");

-- CreateIndex
CREATE UNIQUE INDEX "RefundJob_idempotencyKey_key" ON "RefundJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RefundJob_status_nextRetryAt_idx" ON "RefundJob"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "RefundJob_lockedAt_idx" ON "RefundJob"("lockedAt");

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundJob" ADD CONSTRAINT "RefundJob_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE CASCADE ON UPDATE CASCADE;
