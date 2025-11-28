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

    // Offspring: anchor on alive-at-birth and subtract subsequent recorded offspring deaths
    // Gather births at this location through mating -> doe cage -> rabbitry -> location
    const birthsAtLocation = await prisma.birth.findMany({
      where: {
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
      select: {
        id: true,
        aliveKits: true,
      },
    });

    const birthIds = birthsAtLocation.map((b) => b.id);

    let offspringDeathsByBirth: Record<string, number> = {};
    if (birthIds.length > 0) {
      const offspringDeaths = await prisma.offspringDeath.groupBy({
        by: ['birthId'],
        where: { birthId: { in: birthIds } },
        _sum: { count: true },
      });
      offspringDeathsByBirth = offspringDeaths.reduce<Record<string, number>>((acc, d) => {
        acc[d.birthId] = (d._sum.count ?? 0) as number;
        return acc;
      }, {});
    }

    const offspringCount = birthsAtLocation.reduce((sum, b) => {
      const deaths = offspringDeathsByBirth[b.id] ?? 0;
      const aliveNow = Math.max(0, (b.aliveKits ?? 0) - deaths);
      return sum + aliveNow;
    }, 0);

    const count = parentCount + offspringCount;

    return NextResponse.json({ count, parentCount, offspringCount });
  } catch (error) {
    console.error('Error counting rabbits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
