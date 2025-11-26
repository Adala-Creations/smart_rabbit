const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    // Check if we can query the table at all
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "OffspringBatch"`;
    console.log('Raw SQL count:', count);

    // Try to see table structure
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'OffspringBatch' 
      ORDER BY ordinal_position
    `;
    console.log('\nTable columns:');
    console.table(columns);

    // Check if there are any rows at all (even with broken relationships)
    const allRows = await prisma.$queryRaw`SELECT id, "batchId", status, "birthId", "cageId" FROM "OffspringBatch" LIMIT 10`;
    console.log('\nSample rows (if any):');
    console.table(allRows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();

