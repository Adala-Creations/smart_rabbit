const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restore() {
  try {
    console.log('=== Restoring OffspringDeath Records ===\n');

    // Data from backup3.sql lines 596-599
    const deathData = [
      {
        id: 'cmi7ra1s30001dve4q3ik4vxr',
        birthId: 'cmi7qsqu7000xdvb4o1cq0o8b',
        deathDate: new Date('2025-09-29 00:00:00'),
        count: 1,
        cause: 'Injury',
        notes: 'Suspected crushing',
        createdAt: new Date('2025-11-20 18:19:33.888'),
        updatedAt: new Date('2025-11-20 18:19:33.888'),
      },
      {
        id: 'cmi7u51lt0003dve4d4nqvgp0',
        birthId: 'cmi7qq2xu000tdvb4tersb3o6',
        deathDate: new Date('2025-10-06 00:00:00'),
        count: 1,
        cause: 'Malnutrition',
        notes: 'Kit was not feeding mother\'s milk',
        createdAt: new Date('2025-11-20 19:39:39.071'),
        updatedAt: new Date('2025-11-20 19:39:39.071'),
      },
      {
        id: 'cmi7ud0z10006dve48p9im8k6',
        birthId: 'cmi7qsqu7000xdvb4o1cq0o8b',
        deathDate: new Date('2025-10-24 00:00:00'),
        count: 2,
        cause: 'Injury',
        notes: 'Suspected crushing',
        createdAt: new Date('2025-11-20 19:45:51.608'),
        updatedAt: new Date('2025-11-20 19:45:51.608'),
      },
      {
        id: 'cmi7un22s000ddve4f17v9ves',
        birthId: 'cmi7qsqu7000xdvb4o1cq0o8b',
        deathDate: new Date('2025-11-20 00:00:00'),
        count: 1,
        cause: 'Injury',
        notes: 'Suspected crushing',
        createdAt: new Date('2025-11-20 19:53:39.651'),
        updatedAt: new Date('2025-11-20 19:53:39.651'),
      },
    ];

    console.log('Restoring OffspringDeath records...\n');
    let restored = 0;
    let skipped = 0;

    for (const death of deathData) {
      try {
        // Check if birth exists
        const birth = await prisma.birth.findUnique({ where: { id: death.birthId } });
        if (!birth) {
          console.log(`   ⚠️  Skipping Death ${death.id}: Birth ${death.birthId} not found`);
          skipped++;
          continue;
        }

        // Check if already exists
        const existing = await prisma.offspringDeath.findUnique({ where: { id: death.id } });
        if (existing) {
          console.log(`   ℹ️  Death ${death.id} already exists, skipping`);
          skipped++;
          continue;
        }

        await prisma.offspringDeath.create({ data: death });
        console.log(`   ✅ Restored Death ${death.id} (${death.count} kit(s), ${death.cause})`);
        restored++;
      } catch (error) {
        console.log(`   ❌ Failed to restore Death ${death.id}: ${error.message}`);
      }
    }

    console.log(`\n   ${restored} records restored, ${skipped} skipped.`);

    // Verify
    console.log('\nVerification:');
    const finalCount = await prisma.offspringDeath.count();
    console.log(`   Total OffspringDeath records: ${finalCount}`);

    if (finalCount > 0) {
      // Test API-style query
      const testQuery = await prisma.offspringDeath.findMany({
        include: {
          birth: {
            include: {
              mating: {
                include: {
                  buck: true,
                  doe: true,
                },
              },
            },
          },
        },
        take: 1,
      });

      if (testQuery.length > 0) {
        const sample = testQuery[0];
        console.log(`   ✅ API query works - sample record has:`);
        console.log(`      - Birth: ${!!sample.birth}`);
        console.log(`      - Mating: ${!!sample.birth?.mating}`);
        console.log(`      - Buck: ${!!sample.birth?.mating?.buck}`);
        console.log(`      - Doe: ${!!sample.birth?.mating?.doe}`);
      }
    }

    console.log('\n✅ Restore complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restore();

