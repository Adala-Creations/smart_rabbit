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

    // Parent rabbits: count only active rabbits at the location
    const parentCount = await prisma.rabbit.count({
      where: {
        status: 'ACTIVE',
        cage: {
          rabbitry: {
            locationId,
          },
        },
      },
    });

    // Offspring: sum of active batch counts
    const offspringCount = await prisma.offspringBatch.aggregate({
      where: {
        status: 'ACTIVE',
        birth: {
          mating: {
            doe: {
              cage: {
                rabbitry: {
                  locationId,
                },
              },
            },
          },
        },
      },
      _sum: {
        count: true,
      },
    });

    const offspringTotal = offspringCount._sum.count ?? 0;

    const count = parentCount + offspringTotal;

    return NextResponse.json({ count, parentCount, offspringCount: offspringTotal });
  } catch (error) {
    console.error('Error counting rabbits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
