const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreAll() {
  try {
    console.log('=== Restoring Birth and OffspringBatch Data ===\n');

  // Step 1: Restore Birth records (from backup3.sql lines 506-509)
  const birthData = [
    {
      id: 'cmi7qnfss000pdvb4pjpzux6i',
      matingId: 'cmi7qm9s6000ndvb4gahk4koy',
      birthDate: new Date('2025-09-26 00:00:00'),
      totalKits: 9,
      aliveKits: 9,
      deadKits: 0,
      notes: '100 % successful delivery',
      createdAt: new Date('2025-11-20 18:01:58.971'),
      updatedAt: new Date('2025-11-20 18:01:58.971'),
    },
    {
      id: 'cmi7qsqu7000xdvb4o1cq0o8b',
      matingId: 'cmi7qrpk9000vdvb4wj93s4o9',
      birthDate: new Date('2025-09-28 00:00:00'),
      totalKits: 9,
      aliveKits: 9,
      deadKits: 0,
      notes: '100% successful birth',
      createdAt: new Date('2025-11-20 18:06:06.558'),
      updatedAt: new Date('2025-11-20 18:06:06.558'),
    },
    {
      id: 'cmi7uusha000fdve45k44v400',
      matingId: 'cmi7ql57l000ldvb4cqyz92x3',
      birthDate: new Date('2025-10-30 00:00:00'),
      totalKits: 10,
      aliveKits: 10,
      deadKits: 0,
      notes: '100% success',
      createdAt: new Date('2025-11-20 19:59:40.118'),
      updatedAt: new Date('2025-11-20 20:00:31.853'),
    },
    {
      id: 'cmi7qq2xu000tdvb4tersb3o6',
      matingId: 'cmi7qorrl000rdvb41lagyios',
      birthDate: new Date('2025-09-27 00:00:00'),
      totalKits: 8,
      aliveKits: 3,
      deadKits: 5,
      notes: '5 died..birth occured outside cage',
      createdAt: new Date('2025-11-20 18:04:02.1'),
      updatedAt: new Date('2025-11-20 23:34:38.618'),
    },
  ];

  console.log('1. Restoring Birth records...');
  let birthRestored = 0;
  for (const birth of birthData) {
    try {
      // Check if mating exists
      const mating = await prisma.mating.findUnique({ where: { id: birth.matingId } });
      if (!mating) {
        console.log(`   ⚠️  Skipping Birth ${birth.id}: Mating ${birth.matingId} not found`);
        continue;
      }

      // Check if already exists
      const existing = await prisma.birth.findUnique({ where: { id: birth.id } });
      if (existing) {
        console.log(`   ℹ️  Birth ${birth.id} already exists, skipping`);
        continue;
      }

      await prisma.birth.create({ data: birth });
      console.log(`   ✅ Restored Birth ${birth.id} (${birth.aliveKits} alive kits)`);
      birthRestored++;
    } catch (error) {
      console.log(`   ❌ Failed to restore Birth ${birth.id}: ${error.message}`);
    }
  }

  console.log(`\n   ${birthRestored} Birth records restored.\n`);

  // Step 2: Restore OffspringBatch records
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

  console.log('2. Restoring OffspringBatch records...');
  let offspringRestored = 0;
  for (const data of offspringData) {
    try {
      // Check if birth exists
      const birth = await prisma.birth.findUnique({ where: { id: data.birthId } });
      if (!birth) {
        console.log(`   ⚠️  Skipping ${data.batchId}: Birth ${data.birthId} not found`);
        continue;
      }

      // Check if cage exists (if provided)
      if (data.cageId) {
        const cage = await prisma.cage.findUnique({ where: { id: data.cageId } });
        if (!cage) {
          console.log(`   ⚠️  Skipping ${data.batchId}: Cage ${data.cageId} not found`);
          continue;
        }
      }

      // Check if already exists
      const existing = await prisma.offspringBatch.findUnique({ where: { batchId: data.batchId } });
      if (existing) {
        console.log(`   ℹ️  Batch ${data.batchId} already exists, skipping`);
        continue;
      }

      await prisma.offspringBatch.create({ data });
      console.log(`   ✅ Restored ${data.batchId} (${data.count} kits)`);
      offspringRestored++;
    } catch (error) {
      console.log(`   ❌ Failed to restore ${data.batchId}: ${error.message}`);
    }
  }

  console.log(`\n   ${offspringRestored} OffspringBatch records restored.`);

  // Step 3: Verify
  console.log('\n3. Verification:');
  const finalBirthCount = await prisma.birth.count();
  const finalOffspringCount = await prisma.offspringBatch.count();
  console.log(`   Birth records: ${finalBirthCount}`);
  console.log(`   OffspringBatch records: ${finalOffspringCount}`);

  if (finalOffspringCount > 0) {
    const activeBatches = await prisma.offspringBatch.count({ where: { status: 'ACTIVE' } });
    console.log(`   Active batches: ${activeBatches}`);
  }

    console.log('\n✅ Restore complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAll();

