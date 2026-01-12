const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOffspring() {
  try {
    console.log('Checking offspring...\n');

    const offspringCount = await prisma.offspringBatch.count();
    console.log('OffspringBatch count:', offspringCount);

    if (offspringCount > 0) {
      const offspring = await prisma.offspringBatch.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          batchId: true,
          count: true,
          status: true,
          maleCount: true,
          femaleCount: true,
          cageId: true,
          compartment: true,
          createdAt: true
        }
      });
      console.log('Recent offspring batches:');
      offspring.forEach(o => console.log(`  ID: ${o.id}, BatchId: ${o.batchId}, Count: ${o.count}, Status: ${o.status}, Males: ${o.maleCount}, Females: ${o.femaleCount}, Cage: ${o.cageId || 'None'}`));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOffspring();