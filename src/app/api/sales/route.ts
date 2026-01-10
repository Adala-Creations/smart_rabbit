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

    const sales = await prisma.sale.findMany({
      include: {
        rabbit: true,
        batch: true,
      },
      orderBy: { saleDate: 'desc' },
    });

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

    const { rabbitId, batchId, quantitySold, description, amount, saleDate, buyerName, buyerContact, notes } = await req.json();

    if (!description || !amount || !saleDate) {
      return NextResponse.json(
        { error: 'Description, amount, and saleDate are required' },
        { status: 400 }
      );
    }

    if (rabbitId && batchId) {
      return NextResponse.json(
        { error: 'Cannot sell both individual rabbit and batch at the same time' },
        { status: 400 }
      );
    }

    const sale = await prisma.sale.create({
      data: {
        rabbitId,
        batchId,
        quantitySold: quantitySold ? parseInt(quantitySold) : 1,
        description,
        amount: parseFloat(amount),
        saleDate: new Date(saleDate),
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
        const newCount = Math.max(0, batch.count - (quantitySold ? parseInt(quantitySold) : batch.count));
        await prisma.offspringBatch.update({
          where: { id: batchId },
          data: { count: newCount },
        });
      }
    }

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
