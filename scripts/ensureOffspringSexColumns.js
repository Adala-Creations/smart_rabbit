#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function ensure() {
  try {
    // Check existing columns
    const res = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name = 'OffspringBatch'`);
    const existing = res.map(r => r.column_name);
    const needed = [ 'maleCount', 'femaleCount', 'sexedAt' ];
    const missing = needed.filter(n => !existing.includes(n));
    if (missing.length === 0) {
      console.log('All columns exist: ', needed.join(', '));
      process.exit(0);
    }
    console.log('Missing columns in OffspringBatch:', missing.join(', '));
    // Try to add them
    for (const col of missing) {
      if (col === 'sexedAt') {
        console.log(`Adding column ${col} as timestamptz`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "OffspringBatch" ADD COLUMN IF NOT EXISTS "${col}" timestamptz`);
      } else {
        console.log(`Adding column ${col} as integer`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "OffspringBatch" ADD COLUMN IF NOT EXISTS "${col}" integer`);
      }
    }
    console.log('Done. Columns added.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to ensure columns, likely due to DB permissions. Please run the following SQL as a DB admin:');
    console.error(`\nALTER TABLE "OffspringBatch" ADD COLUMN IF NOT EXISTS "maleCount" integer;`);
    console.error(`ALTER TABLE "OffspringBatch" ADD COLUMN IF NOT EXISTS "femaleCount" integer;`);
    console.error(`ALTER TABLE "OffspringBatch" ADD COLUMN IF NOT EXISTS "sexedAt" timestamptz;\n`);
    console.error('Error details:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

ensure();
