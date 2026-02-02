-- Step 1: First, let's see what OffspringDeath records reference
SELECT od.id, od."birthId", ob.id as batch_id, ob."birthId" as batch_birth_id
FROM "OffspringDeath" od
LEFT JOIN "OffspringBatch" ob ON ob."birthId" = od."birthId"
LIMIT 10;
