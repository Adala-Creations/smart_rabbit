-- Migration script to convert OffspringDeath from birthId to batchId schema

-- Step 1: Add batchId column (nullable for now)
ALTER TABLE "OffspringDeath" 
ADD COLUMN "batchId" text;

-- Step 2: Populate batchId by joining through births to batches
UPDATE "OffspringDeath" od
SET "batchId" = ob.id
FROM "OffspringBatch" ob
WHERE ob."birthId" = od."birthId";

-- Step 3: Make batchId NOT NULL
ALTER TABLE "OffspringDeath" 
ALTER COLUMN "batchId" SET NOT NULL;

-- Step 4: Add foreign key constraint for batchId
ALTER TABLE "OffspringDeath"
ADD CONSTRAINT "OffspringDeath_batchId_fkey" 
FOREIGN KEY ("batchId") REFERENCES "OffspringBatch"("id");

-- Step 5: Drop the old birthId foreign key if it exists
-- First identify the constraint name
-- ALTER TABLE "OffspringDeath" DROP CONSTRAINT "OffspringDeath_birthId_fkey";

-- Step 6: Drop the birthId column
-- ALTER TABLE "OffspringDeath" DROP COLUMN "birthId";

-- Verification queries
SELECT COUNT(*) as total_deaths FROM "OffspringDeath";
SELECT COUNT(*) as deaths_with_batch FROM "OffspringDeath" WHERE "batchId" IS NOT NULL;
SELECT COUNT(*) as deaths_without_birth FROM "OffspringDeath" WHERE "birthId" IS NULL;

-- Show sample migrated records
SELECT id, "batchId", "deathDate", count, cause FROM "OffspringDeath" LIMIT 5;
