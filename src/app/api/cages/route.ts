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
    const rabbitryId = searchParams.get('rabbitryId');
    const id = searchParams.get('id');

    // When `id` is supplied return a single cage with rich rabbit details
    if (id) {
      const cage = await prisma.cage.findUnique({
        where: { id },
        include: {
          rabbitry: {
            include: { location: true },
          },
          rabbits: {
            include: {
              cage: true,
              mother: true,
              father: true,
              weights: { orderBy: { measurementDate: 'desc' }, take: 5 },
              offspring: true,
              matingsAsBuck: true,
              matingsAsDoe: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      return NextResponse.json(cage);
    }

    const where: any = {};
    if (rabbitryId) where.rabbitryId = rabbitryId;

    const cages = await prisma.cage.findMany({
      where,
      include: {
        rabbitry: {
          include: {
            location: true,
          },
        },
        rabbits: {
          include: {
            mother: true,
            father: true,
            weights: { orderBy: { measurementDate: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { cageId: 'asc' },
    });

    return NextResponse.json(cages);
  } catch (error) {
    console.error('Error fetching cages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, rabbitryId, capacity, compartments, description } = await req.json();

    if (!type || !rabbitryId) {
      return NextResponse.json(
        { error: 'Type and rabbitryId are required' },
        { status: 400 }
      );
    }

    // Auto-generate unique cage ID
    const prefix = type === 'BREEDING' ? 'BC-' : 'WC-';
    const lastCage = await prisma.cage.findFirst({
      where: { cageId: { startsWith: prefix } },
      orderBy: { cageId: 'desc' },
    });
    
    let nextNumber = 1;
    if (lastCage) {
      const lastNumber = parseInt(lastCage.cageId.split('-')[1]);
      nextNumber = lastNumber + 1;
    }
    const cageId = `${prefix}${String(nextNumber).padStart(3, '0')}`;

    const cage = await prisma.cage.create({
      data: {
        cageId,
        type,
        rabbitryId,
        capacity: capacity || 1,
        compartments: compartments || capacity || 1,
        description,
      },
      include: {
        rabbitry: true,
      },
    });

    return NextResponse.json(cage, { status: 201 });
  } catch (error) {
    console.error('Error creating cage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, capacity, compartments, description } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Cage ID is required' }, { status: 400 });
    }

    const cage = await prisma.cage.update({
      where: { id },
      data: {
        ...(capacity !== undefined && { capacity }),
        ...(compartments !== undefined && { compartments }),
        ...(description !== undefined && { description }),
      },
      include: {
        rabbitry: true,
      },
    });

    return NextResponse.json(cage);
  } catch (error) {
    console.error('Error updating cage:', error);
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
      return NextResponse.json({ error: 'Cage ID is required' }, { status: 400 });
    }

    // Check if cage has rabbits
    const cage = await prisma.cage.findUnique({
      where: { id },
      include: { rabbits: true },
    });

    if (!cage) {
      return NextResponse.json({ error: 'Cage not found' }, { status: 404 });
    }

    if (cage.rabbits.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete cage with rabbits. Please move rabbits first.' },
        { status: 400 }
      );
    }

    await prisma.cage.delete({ where: { id } });

    return NextResponse.json({ message: 'Cage deleted successfully' });
  } catch (error) {
    console.error('Error deleting cage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
