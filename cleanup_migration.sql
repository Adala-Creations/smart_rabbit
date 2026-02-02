-- Clean up: Drop the old birthId column from OffspringDeath
-- First, drop the foreign key constraint if it exists
ALTER TABLE "OffspringDeath" 
DROP CONSTRAINT IF EXISTS "OffspringDeath_birthId_fkey" CASCADE;

-- Drop the birthId column
ALTER TABLE "OffspringDeath" 
DROP COLUMN IF EXISTS "birthId";

-- Verify final schema
\d "OffspringDeath"
