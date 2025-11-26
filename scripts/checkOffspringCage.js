const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const total = await prisma.offspringBatch.count();
    const nullCage = await prisma.offspringBatch.count({ where: { cageId: null } });
    const nullComp = await prisma.offspringBatch.count({ where: { compartment: null } });
    const sample = await prisma.offspringBatch.findMany({ take: 10, include: { birth: { include: { mating: true } }, cage: true } });

    console.log('Total OffspringBatch records:', total);
    console.log('Records with cageId == null:', nullCage);
    console.log('Records with compartment == null:', nullComp);
    console.log('Sample rows (limit 10):');
    console.table(sample.map(s => ({ id: s.id, batchId: s.batchId, cageId: s.cageId, compartment: s.compartment, birthId: s.birthId })));
  } catch (err) {
    console.error('Error checking offspring batches:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();
