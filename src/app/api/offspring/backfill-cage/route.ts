import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find or create a default BC-001 cage
    let cage = await prisma.cage.findFirst({ where: { cageId: 'BC-001' } });

    if (!cage) {
      // Create a location, rabbitry and cage if nothing exists
      let location = await prisma.location.findFirst();
      if (!location) {
          // set userId using any cast to avoid session type mismatch in compile
          location = await prisma.location.create({ data: { name: 'Default Location', type: 'farm', userId: (session.user as any).id } });
      }

      let rabbitry = await prisma.rabbitry.findFirst({ where: { locationId: location.id } });
      if (!rabbitry) {
        rabbitry = await prisma.rabbitry.create({ data: { name: 'Default Rabbitry', locationId: location.id, ownerId: (session.user as any).id } });
      }

      cage = await prisma.cage.create({ data: { cageId: 'BC-001', rabbitryId: rabbitry.id, type: 'BREEDING', capacity: 10, compartments: 1 } });
    }

    // Update all OffspringBatch records missing cageId
    // Cast types to any since Prisma client may not reflect schema changes until generated
    const updated = await prisma.offspringBatch.updateMany({ where: { cageId: null }, data: { cageId: cage.id, compartment: 1 } });

    return NextResponse.json({ updated: updated.count, cageId: cage.id });
  } catch (error) {
    console.error('Error backfilling offspring cage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
