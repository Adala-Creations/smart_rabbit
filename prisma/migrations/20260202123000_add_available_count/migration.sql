-- Add availableCount to OffspringBatch and backfill from existing counts and offspring deaths

-- Add column as nullable first
ALTER TABLE "OffspringBatch" ADD COLUMN "availableCount" INTEGER;

-- Backfill: availableCount = count - sum(deaths for that batch)
UPDATE "OffspringBatch" AS ob
SET "availableCount" = ob."count" - COALESCE((
  SELECT SUM(od."count") FROM "OffspringDeath" od WHERE od."batchId" = ob."id"
), 0);

-- Ensure no negatives
UPDATE "OffspringBatch" SET "availableCount" = 0 WHERE "availableCount" < 0;

-- Make column NOT NULL and set default
ALTER TABLE "OffspringBatch" ALTER COLUMN "availableCount" SET NOT NULL;
ALTER TABLE "OffspringBatch" ALTER COLUMN "availableCount" SET DEFAULT 0;
