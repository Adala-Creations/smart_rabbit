import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const offspringDeaths = await prisma.offspringDeath.findMany({
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
      orderBy: {
        deathDate: 'desc',
      },
    });

    const formatted = offspringDeaths.map((od) => {
      const bd = od.birth?.birthDate;
      const dd = od.deathDate;
      let ageAtDeath = '-';
      try {
        if (bd && dd) {
          const b = new Date(bd);
          const de = new Date(dd);
          if (!isNaN(b.getTime()) && !isNaN(de.getTime()) && de >= b) {
            let years = de.getFullYear() - b.getFullYear();
            let months = de.getMonth() - b.getMonth();
            let days = de.getDate() - b.getDate();
            if (days < 0) { months -= 1; const prevMonth = new Date(de.getFullYear(), de.getMonth(), 0).getDate(); days += prevMonth; }
            if (months < 0) { years -= 1; months += 12; }
            if (years > 0) ageAtDeath = `${years}y${months > 0 ? ` ${months}m` : ''}`;
            else if (months > 0) ageAtDeath = `${months}m${days > 0 ? ` ${days}d` : ''}`;
            else ageAtDeath = `${days}d`;
          }
        }
      } catch (e) {
        /* ignore */
      }
      return { ...od, ageAtDeath };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching offspring deaths:', error);
    return NextResponse.json({ error: 'Failed to fetch offspring deaths' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { birthId, deathDate, count, cause, notes } = await request.json();

    // Validate required fields
    if (!birthId || !deathDate || !count) {
      return NextResponse.json(
        { error: 'Birth, death date, and count are required' },
        { status: 400 }
      );
    }

    const offspringDeath = await prisma.offspringDeath.create({
      data: {
        birthId,
        deathDate: new Date(deathDate),
        count: parseInt(count),
        cause,
        notes,
      },
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
    });

    return NextResponse.json(offspringDeath, { status: 201 });
  } catch (error) {
    console.error('Error creating offspring death:', error);
    return NextResponse.json({ error: 'Failed to create offspring death record' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, birthId, deathDate, count, cause, notes } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const offspringDeath = await prisma.offspringDeath.update({
      where: { id },
      data: {
        ...(birthId && { birthId }),
        ...(deathDate && { deathDate: new Date(deathDate) }),
        ...(count && { count: parseInt(count) }),
        ...(cause !== undefined && { cause }),
        ...(notes !== undefined && { notes }),
      },
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
    });

    return NextResponse.json(offspringDeath);
  } catch (error) {
    console.error('Error updating offspring death:', error);
    return NextResponse.json({ error: 'Failed to update offspring death' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.offspringDeath.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Offspring death deleted successfully' });
  } catch (error) {
    console.error('Error deleting offspring death:', error);
    return NextResponse.json({ error: 'Failed to delete offspring death' }, { status: 500 });
  }
}
