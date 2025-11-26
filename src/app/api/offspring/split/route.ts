import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateSexingCounts } from '@/lib/offspring';

type SplitBatchInput = {
  count: number;
  maleCount?: number | null;
  femaleCount?: number | null;
  cageId?: string | null;
  compartment?: number | null;
  notes?: string | null;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceBatchId, newBatches } = (await req.json()) as {
      sourceBatchId?: string;
      newBatches?: SplitBatchInput[];
    };

    if (!sourceBatchId || !Array.isArray(newBatches) || newBatches.length === 0) {
      return NextResponse.json(
        { error: 'sourceBatchId and at least one new batch are required' },
        { status: 400 },
      );
    }

    const source = await prisma.offspringBatch.findUnique({
      where: { id: sourceBatchId },
    });

    if (!source) {
      return NextResponse.json({ error: 'Source batch not found' }, { status: 404 });
    }

    // Prevent double-splitting a batch that has already been used as a source
    const existingChildren = await prisma.offspringBatch.findMany({
      where: { sourceBatchId },
    });
    if (existingChildren.length > 0) {
      return NextResponse.json(
        { error: 'This batch has already been sexed/split. Revert first if you need to redo it.' },
        { status: 400 },
      );
    }

    const totalRequested = newBatches.reduce((sum, b) => sum + Number(b.count || 0), 0);
    if (totalRequested !== source.count) {
      return NextResponse.json(
        { error: `Sum of new batch counts (${totalRequested}) must equal source count (${source.count})` },
        { status: 400 },
      );
    }

    // Validate each child batch's male/female counts when provided
    for (const b of newBatches) {
      if (!Number.isInteger(Number(b.count)) || Number(b.count) <= 0) {
        return NextResponse.json({ error: 'Each new batch must have a positive integer count' }, { status: 400 });
      }
      if (
        (b.maleCount !== undefined || b.femaleCount !== undefined) &&
        !validateSexingCounts(b.count, b.maleCount ?? null, b.femaleCount ?? null)
      ) {
        return NextResponse.json(
          { error: 'For each new batch, maleCount + femaleCount must equal its total count when either is provided' },
          { status: 400 },
        );
      }
    }

    // Generate batch IDs sequentially after the latest existing BTC-* batch
    const lastBatch = await prisma.offspringBatch.findFirst({
      where: { batchId: { startsWith: 'BTC-' } },
      orderBy: { batchId: 'desc' },
    });

    let nextNumber = 1;
    if (lastBatch) {
      const lastNumber = parseInt(lastBatch.batchId.split('-')[1]);
      if (!Number.isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Fetch source batch with related records before archiving
    const sourceWithRelations = await prisma.offspringBatch.findUnique({
      where: { id: source.id },
      include: {
        weights: { orderBy: { measurementDate: 'desc' } },
        healthHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!sourceWithRelations) {
      return NextResponse.json({ error: 'Source batch not found' }, { status: 404 });
    }

    const created = await prisma.$transaction(async (tx) => {
      // Mark source as archived/sexed so it no longer represents a live cage batch
      // Keep all related records (weights, health history) on the archived batch for historical reference
      await tx.offspringBatch.update({
        where: { id: source.id },
        data: {
          status: 'ARCHIVED',
          // keep original count for history; new batches hold actual live counts
          // All weights and health history remain on this archived batch
        },
      });

      const results: any[] = [];

      // Get the latest weight from source to optionally copy to new batches
      const latestWeight = sourceWithRelations.weights?.[0];

      for (const b of newBatches) {
        const batchId = `BTC-${String(nextNumber).padStart(3, '0')}`;
        nextNumber += 1;

        const createdChild = await tx.offspringBatch.create({
          data: {
            batchId,
            birthId: source.birthId,
            sourceBatchId: source.id,
            count: Number(b.count),
            status: 'SEXED',
            notes: b.notes ?? source.notes,
            overallHealthStatus: source.overallHealthStatus,
            cageId: b.cageId ?? source.cageId,
            compartment: b.compartment ?? source.compartment ?? 1,
            // Store the sex composition on each batch; for single-sex groups use either maleCount or femaleCount
            ...(b.maleCount !== undefined && { maleCount: Number(b.maleCount) }),
            ...(b.femaleCount !== undefined && { femaleCount: Number(b.femaleCount) }),
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
            weights: { orderBy: { measurementDate: 'desc' } },
            healthHistory: { orderBy: { createdAt: 'desc' } },
            cage: true,
          },
        });

        // Copy the latest weight from source batch to new batch (if exists) as starting point
        if (latestWeight) {
          await tx.offspringWeight.create({
            data: {
              batchId: createdChild.id,
              weight: latestWeight.weight,
              measurementDate: latestWeight.measurementDate,
              notes: `Copied from source batch ${source.batchId} during sexing`,
            },
          });
        }

        // Start each new batch with a health history entry so audit trail remains clear
        await tx.offspringBatchHealthHistory.create({
          data: {
            batchId: createdChild.id,
            status: source.overallHealthStatus,
            notes: `Created via sexing/splitting from batch ${source.batchId}. Original batch archived with ${source.count} kits.`,
          },
        });

        results.push(createdChild);
      }

      return results;
    });

    return NextResponse.json({ sourceId: source.id, created: created }, { status: 201 });
  } catch (error) {
    console.error('Error splitting offspring batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


