const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    console.log('=== Checking Offspring Death Records ===\n');

    // 1. Count total records
    const total = await prisma.offspringDeath.count();
    console.log(`Total OffspringDeath records: ${total}\n`);

    if (total === 0) {
      console.log('⚠️  No offspring death records found in database.');
      console.log('   This could mean:');
      console.log('   - No records were restored from backup');
      console.log('   - Records were deleted');
      console.log('   - Records were never created\n');
      return;
    }

    // 2. Try to fetch with includes (like the API does)
    console.log('2. Fetching with API-style includes...');
    try {
      const withIncludes = await prisma.offspringDeath.findMany({
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
        take: 5,
      });

      console.log(`   ✅ Successfully fetched ${withIncludes.length} records\n`);

      if (withIncludes.length > 0) {
        console.log('3. Sample record structure:');
        const sample = withIncludes[0];
        console.log(`   - ID: ${sample.id}`);
        console.log(`   - Birth ID: ${sample.birthId}`);
        console.log(`   - Death Date: ${sample.deathDate}`);
        console.log(`   - Count: ${sample.count}`);
        console.log(`   - Has Birth: ${!!sample.birth}`);
        if (sample.birth) {
          console.log(`   - Birth Date: ${sample.birth.birthDate}`);
          console.log(`   - Has Mating: ${!!sample.birth.mating}`);
          if (sample.birth.mating) {
            console.log(`   - Has Buck: ${!!sample.birth.mating.buck}`);
            console.log(`   - Has Doe: ${!!sample.birth.mating.doe}`);
            if (sample.birth.mating.buck) {
              console.log(`   - Buck ID: ${sample.birth.mating.buck.rabbitId}`);
            }
            if (sample.birth.mating.doe) {
              console.log(`   - Doe ID: ${sample.birth.mating.doe.rabbitId}`);
            }
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Error fetching with includes: ${error.message}`);
      console.log(`   Stack: ${error.stack}\n`);

      // Try without includes to see if records exist
      console.log('4. Trying without includes...');
      const withoutIncludes = await prisma.offspringDeath.findMany({ take: 5 });
      console.log(`   Found ${withoutIncludes.length} records without includes`);
      if (withoutIncludes.length > 0) {
        console.log(`   Sample: ID=${withoutIncludes[0].id}, birthId=${withoutIncludes[0].birthId}`);
      }
    }

    // 3. Check for missing relationships
    console.log('\n5. Checking for missing relationships...');
    const allDeaths = await prisma.offspringDeath.findMany({
      select: { id: true, birthId: true },
    });

    let missingBirth = 0;
    let missingMating = 0;
    let missingBuck = 0;
    let missingDoe = 0;

    for (const death of allDeaths) {
      const birth = await prisma.birth.findUnique({
        where: { id: death.birthId },
        include: { mating: { include: { buck: true, doe: true } } },
      });

      if (!birth) {
        console.log(`   ❌ Death ${death.id}: Missing Birth (${death.birthId})`);
        missingBirth++;
        continue;
      }

      if (!birth.mating) {
        console.log(`   ⚠️  Death ${death.id}: Birth has no Mating`);
        missingMating++;
        continue;
      }

      if (!birth.mating.buck) {
        console.log(`   ⚠️  Death ${death.id}: Mating has no Buck`);
        missingBuck++;
      }

      if (!birth.mating.doe) {
        console.log(`   ⚠️  Death ${death.id}: Mating has no Doe`);
        missingDoe++;
      }
    }

    console.log(`\n   Summary: ${missingBirth} missing birth, ${missingMating} missing mating, ${missingBuck} missing buck, ${missingDoe} missing doe`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();

