import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const births = await prisma.birth.findMany({
      include: {
        mating: {
          include: {
            buck: true,
            doe: true,
          },
        },
        offspringBatches: true,
      },
      orderBy: { birthDate: 'desc' },
    });

    return NextResponse.json(births);
  } catch (error) {
    console.error('Error fetching births:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matingId, birthDate, totalKits, aliveKits, deadKits, notes } = await req.json();

    if (!matingId || !birthDate || totalKits === undefined || aliveKits === undefined) {
      return NextResponse.json(
        { error: 'MatingId, birthDate, totalKits, and aliveKits are required' },
        { status: 400 }
      );
    }

    const birth = await prisma.birth.create({
      data: {
        matingId,
        birthDate: new Date(birthDate),
        totalKits: parseInt(totalKits),
        aliveKits: parseInt(aliveKits),
        deadKits: deadKits ? parseInt(deadKits) : 0,
        notes,
      },
      include: {
        mating: {
          include: {
            buck: true,
            doe: true,
          },
        },
      },
    });

    // Mark mating as successful
    await prisma.mating.update({
      where: { id: matingId },
      data: { successful: true },
    });

    return NextResponse.json(birth, { status: 201 });
  } catch (error) {
    console.error('Error creating birth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, birthDate, totalKits, aliveKits, deadKits, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Birth ID is required' }, { status: 400 });
    }

    const birth = await prisma.birth.update({
      where: { id },
      data: {
        ...(birthDate !== undefined && { birthDate: new Date(birthDate) }),
        ...(totalKits !== undefined && { totalKits: parseInt(totalKits) }),
        ...(aliveKits !== undefined && { aliveKits: parseInt(aliveKits) }),
        ...(deadKits !== undefined && { deadKits: parseInt(deadKits) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        mating: {
          include: {
            buck: true,
            doe: true,
          },
        },
      },
    });

    return NextResponse.json(birth);
  } catch (error) {
    console.error('Error updating birth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Birth ID is required' }, { status: 400 });
    }

    const birth = await prisma.birth.findUnique({
      where: { id },
    });

    if (!birth) {
      return NextResponse.json({ error: 'Birth not found' }, { status: 404 });
    }

    await prisma.birth.delete({ where: { id } });

    return NextResponse.json({ message: 'Birth record deleted successfully' });
  } catch (error) {
    console.error('Error deleting birth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
