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

    const where: any = {};
    if (locationId) where.locationId = locationId;

    const rabbitries = await prisma.rabbitry.findMany({
      where,
      include: {
        location: true,
        cages: true,
        workers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rabbitries);
  } catch (error) {
    console.error('Error fetching rabbitries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { name, description, locationId } = await req.json();

    if (!name || !locationId) {
      return NextResponse.json(
        { error: 'Name and locationId are required' },
        { status: 400 }
      );
    }

    const rabbitry = await prisma.rabbitry.create({
      data: {
        name,
        description,
        locationId,
        ownerId: user.id,
      },
      include: {
        location: true,
      },
    });

    return NextResponse.json(rabbitry, { status: 201 });
  } catch (error) {
    console.error('Error creating rabbitry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, description, locationId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Rabbitry ID is required' }, { status: 400 });
    }

    const rabbitry = await prisma.rabbitry.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(locationId !== undefined && { locationId }),
      },
      include: {
        location: true,
      },
    });

    return NextResponse.json(rabbitry);
  } catch (error) {
    console.error('Error updating rabbitry:', error);
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
      return NextResponse.json({ error: 'Rabbitry ID is required' }, { status: 400 });
    }

    // Check if rabbitry has cages
    const rabbitry = await prisma.rabbitry.findUnique({
      where: { id },
      include: { cages: true },
    });

    if (!rabbitry) {
      return NextResponse.json({ error: 'Rabbitry not found' }, { status: 404 });
    }

    if (rabbitry.cages.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete rabbitry with cages. Please delete cages first.' },
        { status: 400 }
      );
    }

    await prisma.rabbitry.delete({ where: { id } });

    return NextResponse.json({ message: 'Rabbitry deleted successfully' });
  } catch (error) {
    console.error('Error deleting rabbitry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
