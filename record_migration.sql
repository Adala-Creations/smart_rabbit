-- Insert the migration record for the offspring death schema change
-- This tells Prisma that this migration has already been applied
INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    'migration-' || to_char(now(), 'YYYYMMDDHHmmss'),
    'placeholder_checksum_will_be_verified',
    '20260202102445_update_offspring_death_to_use_batch',
    now(),
    '{}',
    NULL,
    now(),
    0
)
ON CONFLICT (id) DO NOTHING;

-- Verify the migration was recorded
SELECT "migration_name", "finished_at" FROM "_prisma_migrations" WHERE "migration_name" = '20260202102445_update_offspring_death_to_use_batch';
