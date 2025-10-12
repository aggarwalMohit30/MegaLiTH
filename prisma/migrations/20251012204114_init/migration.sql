/*
  Warnings:

  - You are about to drop the column `boostCoefficient` on the `UserBoost` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Referral` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Referral_userId_referrerId_key";

-- DropIndex
DROP INDEX "public"."UserBoost_boostCoefficient_idx";

-- AlterTable
ALTER TABLE "UserBoost" DROP COLUMN "boostCoefficient";

-- CreateIndex
CREATE UNIQUE INDEX "Referral_userId_key" ON "Referral"("userId");
