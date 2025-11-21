import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { batchId, weight, measurementDate, notes } = await req.json();

    if (!batchId || !weight) {
      return NextResponse.json(
        { error: 'BatchId and weight are required' },
        { status: 400 }
      );
    }

    const weightRecord = await prisma.offspringWeight.create({
      data: {
        batchId,
        weight: parseFloat(weight),
        measurementDate: measurementDate ? new Date(measurementDate) : new Date(),
        notes,
      },
    });

    return NextResponse.json(weightRecord, { status: 201 });
  } catch (error) {
    console.error('Error adding offspring weight:', error);
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
      return NextResponse.json({ error: 'Weight ID is required' }, { status: 400 });
    }

    await prisma.offspringWeight.delete({ where: { id } });

    return NextResponse.json({ message: 'Weight record deleted successfully' });
  } catch (error) {
    console.error('Error deleting offspring weight:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
