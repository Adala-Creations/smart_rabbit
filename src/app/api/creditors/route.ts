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

    const creditors = await prisma.creditor.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(creditors);
  } catch (error) {
    console.error('Error fetching creditors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, contact, amountOwed, description, dueDate, status, notes } = await req.json();

    if (!name || !amountOwed || !description) {
      return NextResponse.json(
        { error: 'Name, amount owed, and description are required' },
        { status: 400 }
      );
    }

    const creditor = await prisma.creditor.create({
      data: {
        name,
        contact,
        amountOwed: parseFloat(amountOwed),
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'PENDING',
        notes,
      },
    });

    return NextResponse.json(creditor, { status: 201 });
  } catch (error) {
    console.error('Error creating creditor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, contact, amountOwed, description, dueDate, status, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Creditor ID is required' }, { status: 400 });
    }

    const creditor = await prisma.creditor.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(contact !== undefined && { contact }),
        ...(amountOwed !== undefined && { amountOwed: parseFloat(amountOwed) }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(creditor);
  } catch (error) {
    console.error('Error updating creditor:', error);
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
      return NextResponse.json({ error: 'Creditor ID is required' }, { status: 400 });
    }

    await prisma.creditor.delete({ where: { id } });

    return NextResponse.json({ message: 'Creditor deleted successfully' });
  } catch (error) {
    console.error('Error deleting creditor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}