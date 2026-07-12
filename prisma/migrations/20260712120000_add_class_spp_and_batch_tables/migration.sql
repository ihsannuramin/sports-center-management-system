-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "sppAmount" DECIMAL(12,2);

-- CreateEnum
CREATE TYPE "SppPaymentStatus" AS ENUM ('UNPAID', 'PAID');

-- CreateTable
CREATE TABLE "spp_batches" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spp_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spp_batch_details" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "baseAmount" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "SppPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "proofUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spp_batch_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spp_batches_classId_period_key" ON "spp_batches"("classId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "spp_batch_details_batchId_studentId_key" ON "spp_batch_details"("batchId", "studentId");

-- AddForeignKey
ALTER TABLE "spp_batches" ADD CONSTRAINT "spp_batches_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spp_batch_details" ADD CONSTRAINT "spp_batch_details_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "spp_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spp_batch_details" ADD CONSTRAINT "spp_batch_details_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
