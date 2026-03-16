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

    const { batchId, confirmKey } = (await req.json()) as { batchId?: string; confirmKey?: string };

    if (!batchId) {
      return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
    }

    if (confirmKey !== 'revert') {
      return NextResponse.json({ error: 'Confirmation key is required to revert sexing' }, { status: 400 });
    }

    const batch = await prisma.offspringBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // There are two possible scenarios:
    // 1) Legacy sexing: single batch with male/female counts. Revert by clearing those fields and status back to ACTIVE.
    // 2) New split sexing: this batch is either the archived source or one of the child batches.
    //
    // For simplicity, if this batch has a sourceBatchId we treat it as a child and operate on its source;
    // otherwise, if it has SEXED status and no sourceBatchId we treat it as legacy sexing on this row.

    if (!batch.sourceBatchId) {
      // Legacy case: just restore this batch to ACTIVE, clear counts/sexing info.
      const updated = await prisma.offspringBatch.update({
        where: { id: batch.id },
        data: {
          status: 'ACTIVE',
          maleCount: null,
          femaleCount: null,
          sexedAt: null,
        },
      });
      return NextResponse.json({ revertedType: 'legacy', batch: updated });
    }

    // New-style split: batch is a child, so work against its source.
    const sourceId = batch.sourceBatchId;

    const result = await prisma.$transaction(async (tx) => {
      // Delete all children created from this source
      await tx.offspringBatch.deleteMany({
        where: { sourceBatchId: sourceId },
      });

      // Restore the source as an ACTIVE kit batch
      const restored = await tx.offspringBatch.update({
        where: { id: sourceId },
        data: {
          status: 'ACTIVE',
        },
      });

      return restored;
    });

    return NextResponse.json({ revertedType: 'split', restoredSource: result });
  } catch (error) {
    console.error('Error reverting offspring sexing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


