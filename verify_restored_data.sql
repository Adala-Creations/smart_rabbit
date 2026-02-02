-- Comprehensive verification of restored data

-- Summary counts
SELECT 
    (SELECT COUNT(*) FROM "Rabbit") as total_rabbits,
    (SELECT COUNT(*) FROM "Mating") as total_matings,
    (SELECT COUNT(*) FROM "Birth") as total_births,
    (SELECT COUNT(*) FROM "OffspringBatch") as total_batches,
    (SELECT COUNT(*) FROM "OffspringDeath") as total_offspring_deaths,
    (SELECT COUNT(*) FROM "Death") as total_rabbit_deaths,
    (SELECT COUNT(*) FROM "User") as total_users;

-- Verify batch death relationships
SELECT 
    COUNT(*) as total_deaths,
    SUM(od.count) as total_offspring_died
FROM "OffspringDeath" od;

-- Sample offspring deaths with full hierarchy (what the API returns)
SELECT 
    od.id,
    ob."batchId",
    ob.count as batch_size,
    od.count as died_count,
    od."deathDate",
    od.cause,
    m."matingDate",
    rb.name as buck_name,
    rb2.name as doe_name
FROM "OffspringDeath" od
JOIN "OffspringBatch" ob ON od."batchId" = ob.id
JOIN "Birth" b ON ob."birthId" = b.id
JOIN "Mating" m ON b."matingId" = m.id
LEFT JOIN "Rabbit" rb ON m."buckId" = rb.id
LEFT JOIN "Rabbit" rb2 ON m."doeId" = rb2.id
ORDER BY od."deathDate" DESC
LIMIT 5;
