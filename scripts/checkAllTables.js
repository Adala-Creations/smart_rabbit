const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllTables() {
  try {
    console.log('Checking all tables...\n');

    const tables = [
      'User',
      'Location',
      'Rabbitry',
      'RabbitryWorker',
      'Cage',
      'Rabbit',
      'OffspringBatch',
      'Mating',
      'Birth',
      'Death',
      'OffspringDeath',
      'Sale',
      'Expense',
      'Debtor',
      'Creditor',
      'Notification'
    ];

    for (const table of tables) {
      try {
        const count = await prisma[table.charAt(0).toLowerCase() + table.slice(1)].count();
        console.log(`${table}: ${count}`);
      } catch (error) {
        console.log(`${table}: Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllTables();