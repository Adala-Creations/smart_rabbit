-- Check if OffspringDeath has batchId column
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'OffspringDeath' 
ORDER BY ordinal_position;

-- Sample OffspringDeath records to verify structure
SELECT id, "batchId", "deathDate", count, cause FROM "OffspringDeath" LIMIT 5;
