const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const birthCount = await prisma.birth.count();
    console.log(`Total Birth records: ${birthCount}`);

    if (birthCount > 0) {
      const births = await prisma.birth.findMany({
        select: { id: true, birthDate: true, totalKits: true, aliveKits: true },
        take: 10,
      });
      console.log('\nSample Birth IDs:');
      console.table(births);
    }

    // Check what birthIds the offspring are looking for
    const requiredBirthIds = [
      'cmi7qq2xu000tdvb4tersb3o6',
      'cmi7qsqu7000xdvb4o1cq0o8b',
      'cmi7uusha000fdve45k44v400',
      'cmi7qnfss000pdvb4pjpzux6i',
    ];

    console.log('\nChecking if required Birth IDs exist:');
    for (const birthId of requiredBirthIds) {
      const exists = await prisma.birth.findUnique({ where: { id: birthId } });
      console.log(`  ${birthId}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }

    // Check backup for Birth data
    console.log('\n💡 Tip: Check backup3.sql for Birth records (search for "COPY public.Birth")');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();

