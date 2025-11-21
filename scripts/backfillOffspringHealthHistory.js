/**
 * Backfill offspring health history entries for existing batches that
 * now have the new overallHealthStatus field but lack any history rows.
 *
 * Usage (PowerShell):
 *   $env:DATABASE_URL="postgresql://user:pass@host:port/db"; npm run backfill:offspring-health
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const batches = await prisma.offspringBatch.findMany({
      include: { healthHistory: true },
    });
    let created = 0;
    for (const b of batches) {
      if (!b.healthHistory || b.healthHistory.length === 0) {
        await prisma.offspringBatchHealthHistory.create({
          data: {
            batchId: b.id,
            status: b.overallHealthStatus || 'HEALTHY',
            notes: 'Backfilled initial status',
          },
        });
        created++;
      }
    }
    console.log(`Backfill complete. Added ${created} health history entr${created === 1 ? 'y' : 'ies'}.`);
  } catch (err) {
    console.error('Backfill error:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();