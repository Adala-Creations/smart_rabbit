/*
  Warnings:

  - You are about to drop the column `birthId` on the `OffspringDeath` table. All the data in the column will be lost.
  - Added the required column `batchId` to the `OffspringDeath` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OffspringDeath" DROP CONSTRAINT "OffspringDeath_birthId_fkey";

-- AlterTable
-- First, add the batchId column as nullable
ALTER TABLE "OffspringDeath" ADD COLUMN "batchId" TEXT;

-- Migrate data: set batchId to the first batch for each birth
UPDATE "OffspringDeath" AS od
SET "batchId" = (
  SELECT "OffspringBatch"."id" FROM "OffspringBatch" 
  WHERE "OffspringBatch"."birthId" = (SELECT "birthId" FROM "OffspringDeath" WHERE "OffspringDeath"."id" = od."id")
  LIMIT 1
);

-- Now drop the old column and make batchId NOT NULL
ALTER TABLE "OffspringDeath" DROP COLUMN "birthId";
ALTER TABLE "OffspringDeath" ALTER COLUMN "batchId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "OffspringDeath" ADD CONSTRAINT "OffspringDeath_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "OffspringBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
