-- AlterTable
ALTER TABLE "coaches" ADD COLUMN     "sessionRate" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "coach_payrolls" ADD COLUMN     "baseAmount" DECIMAL(12,2),
ADD COLUMN     "incentiveAmount" DECIMAL(12,2),
ADD COLUMN     "incentiveDetail" JSONB;

-- CreateTable
CREATE TABLE "coach_incentives" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coachId" TEXT NOT NULL,

    CONSTRAINT "coach_incentives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coach_incentives_coachId_idx" ON "coach_incentives"("coachId");

-- AddForeignKey
ALTER TABLE "coach_incentives" ADD CONSTRAINT "coach_incentives_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
