import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function createSale({
  rabbitId,
  batchId,
  quantitySold,
  description,
  amount,
  saleDate,
  buyerName,
  buyerContact,
  notes,
}: {
  rabbitId?: string;
  batchId?: string;
  quantitySold: number;
  description: string;
  amount: number;
  saleDate: Date;
  buyerName?: string;
  buyerContact?: string;
  notes?: string;
}) {
  const sale = await prisma.sale.create({
    data: {
      rabbitId,
      batchId,
      quantitySold,
      description,
      amount,
      saleDate,
      buyerName,
      buyerContact,
      notes,
    },
    include: {
      rabbit: true,
      batch: true,
    },
  });

  // If rabbit is sold, update status
  if (rabbitId) {
    await prisma.rabbit.update({
      where: { id: rabbitId },
      data: { status: 'SOLD' },
    });
  }

  // If batch is sold, update count
  if (batchId) {
    const batch = await prisma.offspringBatch.findUnique({
      where: { id: batchId },
    });
    if (batch) {
      const quantity = Math.max(0, quantitySold);

      // For sexed batches, reduce sex-specific counts instead of main count
      if (batch.status === 'SEXED') {
        const maleCount = batch.maleCount || 0;
        const femaleCount = batch.femaleCount || 0;
        const totalSexed = maleCount + femaleCount;

        if (totalSexed > 0) {
          // Reduce from females first, then males
          let remainingToSell = Math.min(quantity, totalSexed);
          let newFemaleCount = femaleCount;
          let newMaleCount = maleCount;

          if (remainingToSell > 0 && newFemaleCount > 0) {
            const reduceFemales = Math.min(remainingToSell, newFemaleCount);
            newFemaleCount -= reduceFemales;
            remainingToSell -= reduceFemales;
          }

          if (remainingToSell > 0 && newMaleCount > 0) {
            const reduceMales = Math.min(remainingToSell, newMaleCount);
            newMaleCount -= reduceMales;
            remainingToSell -= reduceMales;
          }

          await prisma.offspringBatch.update({
            where: { id: batchId },
            data: {
              maleCount: newMaleCount,
              femaleCount: newFemaleCount,
              count: newMaleCount + newFemaleCount,
              availableCount: newMaleCount + newFemaleCount,
            },
          });
        } else {
          const nextCount = Math.max(0, (batch.availableCount ?? batch.count ?? 0) - quantity);
          await prisma.offspringBatch.update({
            where: { id: batchId },
            data: {
              count: nextCount,
              availableCount: nextCount,
            },
          });
        }
      } else {
        // For unsexed batches, reduce main count
        const newCount = Math.max(0, batch.count - quantity);
        await prisma.offspringBatch.update({
          where: { id: batchId },
          data: {
            count: newCount,
            availableCount: newCount,
          },
        });
      }
    }
  }

  return sale;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sales = await prisma.sale.findMany({
      include: {
        rabbit: true,
        batch: true,
      },
      orderBy: { saleDate: 'desc' },
    });

    console.log('Fetched sales count:', sales.length);
    console.log('Sales data:', sales.map(s => ({ id: s.id, description: s.description, amount: s.amount })));

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rabbitId, batchId, batches, quantitySold, description, amount, saleDate, buyerName, buyerContact, notes } = await req.json();

    if (!description || !amount || !saleDate) {
      return NextResponse.json(
        { error: 'Description, amount, and saleDate are required' },
        { status: 400 }
      );
    }

    // Check for conflicting sale types
    if (rabbitId && (batchId || batches)) {
      return NextResponse.json(
        { error: 'Cannot sell both individual rabbit and batch(es) at the same time' },
        { status: 400 }
      );
    }

    if (batchId && batches) {
      return NextResponse.json(
        { error: 'Cannot specify both batchId and batches array' },
        { status: 400 }
      );
    }

    if (!rabbitId && !batchId && !batches) {
      return NextResponse.json(
        { error: 'Must specify either rabbitId, batchId, or batches array' },
        { status: 400 }
      );
    }

    // Handle single batch sale (backward compatibility)
    if (batchId) {
      const sale = await createSale({
        batchId,
        quantitySold: quantitySold ? parseInt(quantitySold) : 1,
        description,
        amount: parseFloat(amount),
        saleDate: new Date(saleDate),
        buyerName,
        buyerContact,
        notes,
      });
      return NextResponse.json(sale, { status: 201 });
    }

    // Handle multiple batch sales
    if (batches && Array.isArray(batches)) {
      const totalAmount = parseFloat(amount);
      const sales = [];

      for (const batchSale of batches) {
        const sale = await createSale({
          batchId: batchSale.batchId,
          quantitySold: batchSale.quantitySold,
          description: `${description} (${batchSale.batchId})`,
          amount: totalAmount / batches.length, // Split amount equally, or could be weighted
          saleDate: new Date(saleDate),
          buyerName,
          buyerContact,
          notes,
        });
        sales.push(sale);
      }

      return NextResponse.json(sales, { status: 201 });
    }

    // Handle single rabbit sale
    const sale = await createSale({
      rabbitId,
      quantitySold: 1,
      description,
      amount: parseFloat(amount),
      saleDate: new Date(saleDate),
      buyerName,
      buyerContact,
      notes,
    });
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, description, amount, saleDate, buyerName, buyerContact, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
    }

    const sale = await prisma.sale.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(saleDate !== undefined && { saleDate: new Date(saleDate) }),
        ...(buyerName !== undefined && { buyerName }),
        ...(buyerContact !== undefined && { buyerContact }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        rabbit: true,
        batch: true,
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error updating sale:', error);
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
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Revert rabbit status back to ACTIVE if it was marked as SOLD
    if (sale.rabbitId) {
      await prisma.rabbit.update({
        where: { id: sale.rabbitId },
        data: { status: 'ACTIVE' },
      });
    }

    await prisma.sale.delete({ where: { id } });

    return NextResponse.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
