const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRabbits() {
  try {
    console.log('Checking rabbits...\n');

    const rabbitsCount = await prisma.rabbit.count();
    console.log('Rabbits count:', rabbitsCount);

    if (rabbitsCount > 0) {
      const rabbits = await prisma.rabbit.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rabbitId: true,
          name: true,
          status: true,
          gender: true,
          breed: true,
          cageId: true,
          compartment: true,
          healthStatus: true,
          createdAt: true
        }
      });
      console.log('Recent rabbits:');
      rabbits.forEach(r => console.log(`  ID: ${r.id}, RabbitId: ${r.rabbitId}, Name: ${r.name || 'Unnamed'}, Status: ${r.status}, Gender: ${r.gender}, Cage: ${r.cageId || 'None'}`));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRabbits();