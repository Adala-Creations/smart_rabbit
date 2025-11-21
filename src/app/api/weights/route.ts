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
    const rabbitId = searchParams.get('rabbitId');

    const where = rabbitId ? { rabbitId } : {};

    const weights = await prisma.weightMeasurement.findMany({
      where,
      include: {
        rabbit: true,
      },
      orderBy: { measurementDate: 'desc' },
    });

    return NextResponse.json(weights);
  } catch (error) {
    console.error('Error fetching weights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rabbitId, weight, measurementDate, notes } = await req.json();

    if (!rabbitId || !weight) {
      return NextResponse.json(
        { error: 'RabbitId and weight are required' },
        { status: 400 }
      );
    }

    const weightMeasurement = await prisma.weightMeasurement.create({
      data: {
        rabbitId,
        weight: parseFloat(weight),
        measurementDate: measurementDate ? new Date(measurementDate) : new Date(),
        notes,
      },
      include: {
        rabbit: true,
      },
    });

    return NextResponse.json(weightMeasurement, { status: 201 });
  } catch (error) {
    console.error('Error creating weight measurement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, weight, measurementDate, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Weight measurement ID is required' }, { status: 400 });
    }

    const weightMeasurement = await prisma.weightMeasurement.update({
      where: { id },
      data: {
        ...(weight !== undefined && { weight: parseFloat(weight) }),
        ...(measurementDate !== undefined && { measurementDate: new Date(measurementDate) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        rabbit: true,
      },
    });

    return NextResponse.json(weightMeasurement);
  } catch (error) {
    console.error('Error updating weight measurement:', error);
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
      return NextResponse.json({ error: 'Weight measurement ID is required' }, { status: 400 });
    }

    const weightMeasurement = await prisma.weightMeasurement.findUnique({
      where: { id },
    });

    if (!weightMeasurement) {
      return NextResponse.json({ error: 'Weight measurement not found' }, { status: 404 });
    }

    await prisma.weightMeasurement.delete({ where: { id } });

    return NextResponse.json({ message: 'Weight measurement deleted successfully' });
  } catch (error) {
    console.error('Error deleting weight measurement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
