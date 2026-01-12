const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFinancialTables() {
  try {
    console.log('Checking financial tables...\n');

    // Sales
    const salesCount = await prisma.sale.count();
    console.log('Sales count:', salesCount);
    if (salesCount > 0) {
      const sales = await prisma.sale.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
      console.log('Recent sales:');
      sales.forEach(s => console.log(`  ID: ${s.id}, Desc: ${s.description}, Amount: ${s.amount}`));
    }

    // Expenses
    const expensesCount = await prisma.expense.count();
    console.log('\nExpenses count:', expensesCount);
    if (expensesCount > 0) {
      const expenses = await prisma.expense.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
      console.log('Recent expenses:');
      expenses.forEach(e => console.log(`  ID: ${e.id}, Desc: ${e.description}, Amount: ${e.amount}`));
    }

    // Debtors
    const debtorsCount = await prisma.debtor.count();
    console.log('\nDebtors count:', debtorsCount);
    if (debtorsCount > 0) {
      const debtors = await prisma.debtor.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
      console.log('Recent debtors:');
      debtors.forEach(d => console.log(`  ID: ${d.id}, Name: ${d.name}, Amount: ${d.amountOwed}`));
    }

    // Creditors
    const creditorsCount = await prisma.creditor.count();
    console.log('\nCreditors count:', creditorsCount);
    if (creditorsCount > 0) {
      const creditors = await prisma.creditor.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
      console.log('Recent creditors:');
      creditors.forEach(c => console.log(`  ID: ${c.id}, Name: ${c.name}, Amount: ${c.amountOwed}`));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFinancialTables();