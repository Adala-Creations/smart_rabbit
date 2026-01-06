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

    const matings = await prisma.mating.findMany({
      include: {
        buck: true,
        doe: true,
        births: true,
      },
      orderBy: { matingDate: 'desc' },
    });

    return NextResponse.json(matings);
  } catch (error) {
    console.error('Error fetching matings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { buckId, doeId, matingDate, expectedKindlingDate, notes } = await req.json();

    if (!buckId || !doeId || !matingDate) {
      return NextResponse.json(
        { error: 'BuckId, doeId, and matingDate are required' },
        { status: 400 }
      );
    }

    // Verify buck and doe exist and are correct gender
    const buck = await prisma.rabbit.findUnique({ where: { id: buckId } });
    const doe = await prisma.rabbit.findUnique({ where: { id: doeId } });

    if (!buck || buck.gender !== 'BUCK') {
      return NextResponse.json({ error: 'Invalid buck' }, { status: 400 });
    }

    if (!doe || doe.gender !== 'DOE') {
      return NextResponse.json({ error: 'Invalid doe' }, { status: 400 });
    }

    // Calculate expected kindling date if not provided (28-31 days)
    const matingDateObj = new Date(matingDate);
    const expectedDate = expectedKindlingDate 
      ? new Date(expectedKindlingDate)
      : new Date(matingDateObj.getTime() + 30 * 24 * 60 * 60 * 1000);

    const mating = await prisma.mating.create({
      data: {
        buckId,
        doeId,
        matingDate: matingDateObj,
        expectedKindlingDate: expectedDate,
        notes,
      },
      include: {
        buck: true,
        doe: true,
      },
    });

    // Create notification for the mating
    await prisma.notification.create({
      data: {
        type: 'MATING',
        title: 'New Mating Recorded',
        message: `Buck ${mating.buck.rabbitId} mated with Doe ${mating.doe.rabbitId} on ${matingDateObj.toLocaleDateString()}`,
        priority: 'NORMAL',
        relatedId: mating.id,
      },
    });

    return NextResponse.json(mating, { status: 201 });
  } catch (error) {
    console.error('Error creating mating:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, buckId, doeId, matingDate, expectedKindlingDate, successful, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Mating ID is required' }, { status: 400 });
    }

    const mating = await prisma.mating.update({
      where: { id },
      data: {
        ...(buckId !== undefined && { buckId }),
        ...(doeId !== undefined && { doeId }),
        ...(matingDate !== undefined && { matingDate: new Date(matingDate) }),
        ...(expectedKindlingDate !== undefined && { expectedKindlingDate: new Date(expectedKindlingDate) }),
        ...(successful !== undefined && { successful }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        buck: true,
        doe: true,
      },
    });

    return NextResponse.json(mating);
  } catch (error) {
    console.error('Error updating mating:', error);
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
      return NextResponse.json({ error: 'Mating ID is required' }, { status: 400 });
    }

    // Check if mating has births
    const mating = await prisma.mating.findUnique({
      where: { id },
      include: { births: true },
    });

    if (!mating) {
      return NextResponse.json({ error: 'Mating not found' }, { status: 404 });
    }

    if (mating.births.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete mating with birth records. Please delete births first.' },
        { status: 400 }
      );
    }

    await prisma.mating.delete({ where: { id } });

    return NextResponse.json({ message: 'Mating deleted successfully' });
  } catch (error) {
    console.error('Error deleting mating:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
