/**
 * Backfill offspring batches missing cageId/compartment to default 'BC-001' cage and compartment 1.
 *
 * Usage (PowerShell):
 *   $env:DATABASE_URL="postgresql://user:pass@host:port/db"; node ./scripts/backfillOffspringCage.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // find or create a BC-001 cage
    let cage = await prisma.cage.findFirst({ where: { cageId: 'BC-001' } });

    if (!cage) {
      console.log('BC-001 cage not found. Creating default location, rabbitry, and cage.');
      let location = await prisma.location.findFirst();
      if (!location) {
        location = await prisma.location.create({ data: { name: 'Default Location', type: 'farm', userId: (await prisma.user.findFirst()).id } });
      }
      let rabbitry = await prisma.rabbitry.findFirst({ where: { locationId: location.id } });
      if (!rabbitry) {
        rabbitry = await prisma.rabbitry.create({ data: { name: 'Default Rabbitry', locationId: location.id, ownerId: (await prisma.user.findFirst()).id } });
      }
      cage = await prisma.cage.create({ data: { cageId: 'BC-001', rabbitryId: rabbitry.id, type: 'BREEDING', capacity: 10, compartments: 1 } });
      console.log('Created cage BC-001 with id:', cage.id);
    }

    const result = await prisma.offspringBatch.updateMany({ where: { cageId: null }, data: { cageId: cage.id, compartment: 1 } });
    console.log(`Updated ${result.count} offspring batches to cage BC-001, compartment 1`);
  } catch (err) {
    console.error('Backfill error:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();
