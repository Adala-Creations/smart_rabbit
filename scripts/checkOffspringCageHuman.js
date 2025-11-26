const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const sample = await prisma.offspringBatch.findMany({ take: 20, include: { cage: true } });
    console.log('Total sample rows:', sample.length);
    sample.forEach(s => {
      console.log(`${s.batchId} - OffspringBatch.cageId=${s.cageId} -> Cage.cageId=${s.cage?.cageId ?? 'N/A'} compartment=${s.compartment}`);
    });
  } catch (err) {
    console.error('Error checking offspring batches for human cage id:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();
