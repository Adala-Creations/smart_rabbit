const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  console.log('=== Offspring Batch Diagnosis ===\n');

  try {
    // 1. Count total batches
    const totalBatches = await prisma.offspringBatch.count();
    console.log(`1. Total OffspringBatch records: ${totalBatches}`);

    // 2. Count by status
    const byStatus = await prisma.offspringBatch.groupBy({
      by: ['status'],
      _count: true,
    });
    console.log('\n2. Batches by status:');
    byStatus.forEach((s) => {
      console.log(`   - ${s.status || '(null)'}: ${s._count}`);
    });

    // 3. Check for missing relationships
    console.log('\n3. Checking relationships...');
    const batches = await prisma.offspringBatch.findMany({
      select: {
        id: true,
        batchId: true,
        birthId: true,
        cageId: true,
        status: true,
      },
    });

    let missingBirth = 0;
    let missingCage = 0;
    let validBatches = 0;

    for (const batch of batches) {
      const birth = await prisma.birth.findUnique({ where: { id: batch.birthId } });
      if (!birth) {
        console.log(`   ❌ Batch ${batch.batchId}: Missing Birth (birthId: ${batch.birthId})`);
        missingBirth++;
        continue;
      }

      if (batch.cageId) {
        const cage = await prisma.cage.findUnique({ where: { id: batch.cageId } });
        if (!cage) {
          console.log(`   ⚠️  Batch ${batch.batchId}: Missing Cage (cageId: ${batch.cageId})`);
          missingCage++;
        }
      }

      // Check if birth has mating
      const birthWithMating = await prisma.birth.findUnique({
        where: { id: batch.birthId },
        include: { mating: true },
      });

      if (!birthWithMating?.mating) {
        console.log(`   ⚠️  Batch ${batch.batchId}: Birth has no Mating record`);
      } else {
        validBatches++;
      }
    }

    console.log(`\n   Summary: ${validBatches} valid, ${missingBirth} missing birth, ${missingCage} missing cage`);

    // 4. Test the API query
    console.log('\n4. Testing API query (with includes)...');
    try {
      const apiResult = await prisma.offspringBatch.findMany({
        where: { status: 'ACTIVE' },
        include: {
          birth: {
            include: {
              mating: {
                include: {
                  buck: { include: { cage: true } },
                  doe: { include: { cage: true } },
                },
              },
            },
          },
          weights: { orderBy: { measurementDate: 'desc' } },
          healthHistory: { orderBy: { createdAt: 'desc' } },
          cage: true,
        },
        take: 5,
      });
      console.log(`   ✅ API query returned ${apiResult.length} batches`);
      if (apiResult.length > 0) {
        console.log(`   Sample batch: ${apiResult[0].batchId}`);
        console.log(`   - Has birth: ${!!apiResult[0].birth}`);
        console.log(`   - Has mating: ${!!apiResult[0].birth?.mating}`);
        console.log(`   - Has cage: ${!!apiResult[0].cage}`);
      }
    } catch (error) {
      console.log(`   ❌ API query failed: ${error.message}`);
    }

    // 5. Check for new columns
    console.log('\n5. Checking new schema columns...');
    const sample = await prisma.offspringBatch.findFirst();
    if (sample) {
      console.log(`   - sourceBatchId: ${sample.sourceBatchId || '(null)'}`);
      console.log(`   - maleCount: ${sample.maleCount ?? '(null)'}`);
      console.log(`   - femaleCount: ${sample.femaleCount ?? '(null)'}`);
      console.log(`   - sexedAt: ${sample.sexedAt || '(null)'}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();

