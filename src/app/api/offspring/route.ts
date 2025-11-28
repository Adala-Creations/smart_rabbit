import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateSexingCounts } from '@/lib/offspring';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    // Exclude ARCHIVED batches by default (they're historical records after sexing)
    // Only include them if explicitly requested
    const where = status 
      ? { status } 
      : { status: { not: 'ARCHIVED' } };

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
            offspringDeaths: true,
          },
        },
        weights: { orderBy: { measurementDate: 'desc' } },
        healthHistory: { orderBy: { createdAt: 'desc' } },
        cage: true,
      },
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Adjust live counts by subtracting recorded offspring deaths per birth (oldest batches lose kits first)
    const batchesByBirth: Record<string, any[]> = {};
    offspring.forEach((batch) => {
      const birthId = batch.birthId;
      if (!batchesByBirth[birthId]) {
        (batchesByBirth as any)[birthId] = [];
      }
      (batchesByBirth as any)[birthId].push(batch);
    });
    Object.values(batchesByBirth).forEach((list: any[]) =>
      list.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    );

    const adjustedCountByBatch: Record<string, number> = {};
    Object.entries(batchesByBirth).forEach(([birthId, list]: [string, any[]]) => {
      const totalDeaths =
        list[0]?.birth?.offspringDeaths?.reduce(
          (sum: number, od: any) => sum + (od.count || 0),
          0,
        ) || 0;
      let remaining = totalDeaths;

      list.forEach((batch) => {
        if (remaining <= 0) {
          adjustedCountByBatch[batch.id] = batch.count;
          return;
        }
        const deathsForBatch = Math.min(remaining, batch.count);
        adjustedCountByBatch[batch.id] = batch.count - deathsForBatch;
        remaining -= deathsForBatch;
      });
    });

    const decoratedOffspring = offspring.map((batch) => {
      const availableCount =
        adjustedCountByBatch[batch.id] !== undefined
          ? Math.max(0, adjustedCountByBatch[batch.id])
          : batch.count;
      return {
        ...batch,
        originalCount: batch.count,
        availableCount,
        deceasedKits: Math.max(0, batch.count - availableCount),
      };
    });

    const total = await prisma.offspringBatch.count({ where });
    return NextResponse.json({ items: decoratedOffspring, total, page, pageSize });
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

    const { birthId, count, notes, weight, overallHealthStatus, cageId, compartment } = await req.json();

    if (!birthId || !count) {
      return NextResponse.json(
        { error: 'BirthId and count are required' },
        { status: 400 }
      );
    }

    // Prevent duplicate batches for the same birth
    const existingBatch = await prisma.offspringBatch.findFirst({ where: { birthId } });
    if (existingBatch) {
      return NextResponse.json({ error: 'This birth already has an offspring batch' }, { status: 400 });
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

    // Ensure cageId exists in DB; if not provided, use BC-001 default (create if necessary)
    let targetCageId = cageId;
    if (!targetCageId) {
      let defaultCage = await prisma.cage.findFirst({ where: { cageId: 'BC-001' } });
      if (!defaultCage) {
        // Create default location/rabbitry/cage
        let location = await prisma.location.findFirst();
        if (!location) {
          location = await prisma.location.create({ data: { name: 'Default Location', type: 'farm', userId: (session.user as any).id } });
        }
        let rabbitry = await prisma.rabbitry.findFirst({ where: { locationId: location.id } });
        if (!rabbitry) {
          rabbitry = await prisma.rabbitry.create({ data: { name: 'Default Rabbitry', locationId: location.id, ownerId: (session.user as any).id } });
        }
        defaultCage = await prisma.cage.create({ data: { cageId: 'BC-001', rabbitryId: rabbitry.id, type: 'BREEDING', capacity: 10, compartments: 1 } });
      }
      targetCageId = defaultCage.id;
    }

    const batch = await prisma.offspringBatch.create({
      data: {
        batchId,
        birthId,
        count: parseInt(count),
        notes,
        ...(targetCageId && { cageId: targetCageId }),
        ...(compartment !== undefined && { compartment: parseInt(compartment) }),
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
        cage: true,
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

    const { id, count, status, notes, overallHealthStatus, healthNotes, cageId, compartment, maleCount, femaleCount, sexedAt } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    // Fetch existing to compare health status and original count
    const existing = await prisma.offspringBatch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // NOTE: This endpoint now only supports the legacy "one batch with male/female counts" flow.
    // New-style sexing (splitting into multiple batches) is handled by the /api/offspring/split route.
    // We keep the validation here so old data can still be updated safely.
    if (status === 'SEXED') {
      const male = maleCount !== undefined ? Number(maleCount as any) : existing?.maleCount ?? null;
      const female = femaleCount !== undefined ? Number(femaleCount as any) : existing?.femaleCount ?? null;
      const currentCount = count !== undefined ? Number(count as any) : existing?.count ?? 0;
      if (!validateSexingCounts(currentCount, male, female)) {
        return NextResponse.json({ error: 'Male + Female must equal total count when marking as SEXED' }, { status: 400 });
      }
    }

    const batch = await prisma.offspringBatch.update({
      where: { id },
      data: {
        ...(count !== undefined && { count: parseInt(count) }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(overallHealthStatus && { overallHealthStatus }),
        ...(cageId !== undefined && { cageId }),
        ...(compartment !== undefined && { compartment: parseInt(compartment) }),
        ...(maleCount !== undefined && { maleCount: parseInt(maleCount) }),
        ...(femaleCount !== undefined && { femaleCount: parseInt(femaleCount) }),
        ...(sexedAt !== undefined && { sexedAt: new Date(sexedAt) }),
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
        cage: true,
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
        cage: true,
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
