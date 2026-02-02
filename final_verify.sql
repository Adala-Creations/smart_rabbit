-- Final verification query to confirm data with batch relationships
SELECT 
    od.id as death_id,
    od."batchId",
    od."deathDate",
    od.count,
    od.cause,
    ob."batchId" as batch_display_id,
    ob.count as batch_count,
    b."birthDate",
    m."matingDate",
    rb.name as buck_name,
    rb2.name as doe_name
FROM "OffspringDeath" od
JOIN "OffspringBatch" ob ON od."batchId" = ob.id
JOIN "Birth" b ON ob."birthId" = b.id
JOIN "Mating" m ON b."matingId" = m.id
LEFT JOIN "Rabbit" rb ON m."buckId" = rb.id
LEFT JOIN "Rabbit" rb2 ON m."doeId" = rb2.id
ORDER BY od."deathDate" DESC;
