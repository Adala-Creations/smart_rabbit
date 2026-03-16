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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get('page');
    if (!pageParam) {
      // old behavior: return full list for backwards compatibility
      const locations = await prisma.location.findMany({
        where: { userId: user.id },
        include: {
          rabbitries: {
            include: {
              cages: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(locations);
    }

    const page = parseInt(pageParam ?? '1');
    const perPage = parseInt(searchParams.get('perPage') ?? '10');
    const sort = (searchParams.get('sort') ?? 'createdAt_desc') as
      | 'createdAt_desc'
      | 'name_asc'
      | 'name_desc';

    const skip = (page - 1) * perPage;

    const where = { userId: user.id };

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'name_asc') orderBy = { name: 'asc' };
    if (sort === 'name_desc') orderBy = { name: 'desc' };

    const total = await prisma.location.count({ where });

    const locations = await prisma.location.findMany({
      where,
      include: {
        rabbitries: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy,
      skip,
      take: perPage,
    });

    return NextResponse.json({ items: locations, total });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existingLocationCount = await prisma.location.count({
      where: { userId: user.id },
    });

    if (existingLocationCount > 0) {
      return NextResponse.json(
        { error: 'Only one location is supported for now.' },
        { status: 400 }
      );
    }

    const { name, description, type, address } = await req.json();

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        name,
        description,
        type,
        address,
        userId: user.id,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, description, type, address } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(address !== undefined && { address }),
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
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
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    // Check if location has rabbitries
    const location = await prisma.location.findUnique({
      where: { id },
      include: { rabbitries: true },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    if (location.rabbitries.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location with rabbitries. Please delete rabbitries first.' },
        { status: 400 }
      );
    }

    await prisma.location.delete({ where: { id } });

    return NextResponse.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
