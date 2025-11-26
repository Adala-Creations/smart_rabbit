const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreOffspring() {
  console.log('Restoring OffspringBatch data from backup...\n');

  // Data from backup3.sql lines 571-574
  const offspringData = [
    {
      id: 'cmi80vro80007dvrg8if02xrb',
      batchId: 'BTC-004',
      birthId: 'cmi7qq2xu000tdvb4tersb3o6',
      count: 1,
      status: 'ACTIVE',
      notes: null,
      createdAt: new Date('2025-11-20 22:48:23.769'),
      updatedAt: new Date('2025-11-26 11:18:13.45'),
      overallHealthStatus: 'HEALTHY',
      cageId: 'cmi7psk260007dvrssgha1kf9',
      compartment: 2,
      // New columns (set to null for old data)
      sourceBatchId: null,
      maleCount: null,
      femaleCount: null,
      sexedAt: null,
    },
    {
      id: 'cmi8097x70003dvrgx8idmqgm',
      batchId: 'BTC-002',
      birthId: 'cmi7qsqu7000xdvb4o1cq0o8b',
      count: 5,
      status: 'ACTIVE',
      notes: null,
      createdAt: new Date('2025-11-20 22:30:51.74'),
      updatedAt: new Date('2025-11-26 11:18:50.462'),
      overallHealthStatus: 'HEALTHY',
      cageId: 'cmi7psk260007dvrssgha1kf9',
      compartment: 2,
      sourceBatchId: null,
      maleCount: null,
      femaleCount: null,
      sexedAt: null,
    },
    {
      id: 'cmi808unt0001dvrgbjf5f8au',
      batchId: 'BTC-001',
      birthId: 'cmi7uusha000fdve45k44v400',
      count: 10,
      status: 'ACTIVE',
      notes: null,
      createdAt: new Date('2025-11-20 22:30:34.548'),
      updatedAt: new Date('2025-11-26 11:19:13.661'),
      overallHealthStatus: 'INJURED',
      cageId: 'cmi7psk260007dvrssgha1kf9',
      compartment: 12,
      sourceBatchId: null,
      maleCount: null,
      femaleCount: null,
      sexedAt: null,
    },
    {
      id: 'cmi80v2h50005dvrg0toij07z',
      batchId: 'BTC-003',
      birthId: 'cmi7qnfss000pdvb4pjpzux6i',
      count: 9,
      status: 'ACTIVE',
      notes: null,
      createdAt: new Date('2025-11-20 22:47:51.113'),
      updatedAt: new Date('2025-11-26 11:20:07.324'),
      overallHealthStatus: 'HEALTHY',
      cageId: 'cmi7psk260007dvrssgha1kf9',
      compartment: 5,
      sourceBatchId: null,
      maleCount: null,
      femaleCount: null,
      sexedAt: null,
    },
  ];

  try {
    // Check if records already exist
    const existing = await prisma.offspringBatch.findMany({
      where: { batchId: { in: offspringData.map((d) => d.batchId) } },
    });

    if (existing.length > 0) {
      console.log(`⚠️  Found ${existing.length} existing records. Skipping duplicates.`);
      console.log('Existing batchIds:', existing.map((e) => e.batchId).join(', '));
    }

    // Insert only new records
    const toInsert = offspringData.filter(
      (d) => !existing.some((e) => e.batchId === d.batchId)
    );

    if (toInsert.length === 0) {
      console.log('✅ All records already exist. Nothing to restore.');
      return;
    }

    console.log(`Inserting ${toInsert.length} records...`);

    for (const data of toInsert) {
      try {
        // Verify birth exists
        const birth = await prisma.birth.findUnique({ where: { id: data.birthId } });
        if (!birth) {
          console.log(`   ⚠️  Skipping ${data.batchId}: Birth ${data.birthId} not found`);
          continue;
        }

        // Verify cage exists (if provided)
        if (data.cageId) {
          const cage = await prisma.cage.findUnique({ where: { id: data.cageId } });
          if (!cage) {
            console.log(`   ⚠️  Skipping ${data.batchId}: Cage ${data.cageId} not found`);
            continue;
          }
        }

        await prisma.offspringBatch.create({ data });
        console.log(`   ✅ Restored ${data.batchId} (${data.count} kits)`);
      } catch (error) {
        console.log(`   ❌ Failed to restore ${data.batchId}: ${error.message}`);
      }
    }

    console.log('\n✅ Restore complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreOffspring();

