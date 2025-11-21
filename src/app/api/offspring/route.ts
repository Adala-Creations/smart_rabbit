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

    const offspring = await prisma.offspringBatch.findMany({
      include: {
        birth: {
          include: {
            mating: {
              include: {
                buck: { include: { cage: true } },
                doe: { include: { cage: true } },
              },
            },
          },
        },
        weights: { orderBy: { measurementDate: 'desc' } },
        healthHistory: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(offspring);
  } catch (error) {
    console.error('Error fetching offspring:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { birthId, count, notes, weight, overallHealthStatus } = await req.json();

    if (!birthId || !count) {
      return NextResponse.json(
        { error: 'BirthId and count are required' },
        { status: 400 }
      );
    }

    // Auto-generate unique batch ID
    const lastBatch = await prisma.offspringBatch.findFirst({
      where: { batchId: { startsWith: 'BTC-' } },
      orderBy: { batchId: 'desc' },
    });
    
    let nextNumber = 1;
    if (lastBatch) {
      const lastNumber = parseInt(lastBatch.batchId.split('-')[1]);
      nextNumber = lastNumber + 1;
    }
    const batchId = `BTC-${String(nextNumber).padStart(3, '0')}`;

    const batch = await prisma.offspringBatch.create({
      data: {
        batchId,
        birthId,
        count: parseInt(count),
        notes,
        ...(overallHealthStatus && { overallHealthStatus }),
      },
      include: {
        birth: {
          include: {
            mating: {
              include: {
                buck: { include: { cage: true } },
                doe: { include: { cage: true } },
              },
            },
          },
        },
        healthHistory: true,
      },
    });

    // Create initial health history entry
    await prisma.offspringBatchHealthHistory.create({
      data: {
        batchId: batch.id,
        status: overallHealthStatus || 'HEALTHY',
        notes: 'Initial status',
      },
    });

    // If weight is provided, create initial weight measurement
    if (weight) {
      await prisma.offspringWeight.create({
        data: {
          batchId: batch.id,
          weight: parseFloat(weight),
          measurementDate: new Date(),
        },
      });
    }

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error('Error creating offspring batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, count, status, notes, overallHealthStatus, healthNotes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    // Fetch existing to compare health status
    const existing = await prisma.offspringBatch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const batch = await prisma.offspringBatch.update({
      where: { id },
      data: {
        ...(count !== undefined && { count: parseInt(count) }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(overallHealthStatus && { overallHealthStatus }),
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
        weights: { orderBy: { measurementDate: 'desc' } },
        healthHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (overallHealthStatus && existing.overallHealthStatus !== overallHealthStatus) {
      await prisma.offspringBatchHealthHistory.create({
        data: {
          batchId: id,
          status: overallHealthStatus,
          notes: healthNotes || `Status changed from ${existing.overallHealthStatus} to ${overallHealthStatus}`,
        },
      });
    }

    // Return updated with refreshed history
    const updated = await prisma.offspringBatch.findUnique({
      where: { id },
      include: {
        birth: { include: { mating: { include: { buck: { include: { cage: true } }, doe: { include: { cage: true } } } } } },
        weights: { orderBy: { measurementDate: 'desc' } },
        healthHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating offspring batch:', error);
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
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    await prisma.offspringBatch.delete({ where: { id } });

    return NextResponse.json({ message: 'Offspring batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting offspring batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
