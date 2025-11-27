import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    // First, get all rabbits in the location
    const rabbits = await prisma.rabbit.findMany({
      where: {
        cage: {
          rabbitry: {
            locationId: locationId
          }
        }
      },
      include: {
        // Include the offspring relation
        offspring: true
      }
    });

    // Count parent rabbits and their offspring
    const count = rabbits.reduce((total, rabbit) => {
      return total + 1 + (rabbit.offspring?.length || 0);
    }, 0);

    // Get just the parent count
    const parentCount = rabbits.length;
    
    // Calculate total offspring
    const offspringCount = rabbits.reduce((total, rabbit) => {
      return total + (rabbit.offspring?.length || 0);
    }, 0);

    console.log('Total parent rabbits:', parentCount);
    console.log('Total offspring:', offspringCount);
    console.log('Total count (parents + offspring):', count);

    return NextResponse.json({ 
      count,
      parentCount,
      offspringCount
    });
  } catch (error) {
    console.error('Error counting rabbits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
