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

    const expenses = await prisma.expense.findMany({
      orderBy: { expenseDate: 'desc' },
    });

    console.log('Fetched expenses count:', expenses.length);
    console.log('Expenses data:', expenses.map(e => ({ id: e.id, description: e.description, amount: e.amount })));

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, category, amount, expenseDate, vendor, notes } = await req.json();

    if (!description || !category || !amount || !expenseDate) {
      return NextResponse.json(
        { error: 'Description, category, amount, and expenseDate are required' },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        category,
        amount: parseFloat(amount),
        expenseDate: new Date(expenseDate),
        vendor,
        notes,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, description, category, amount, expenseDate, vendor, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(expenseDate !== undefined && { expenseDate: new Date(expenseDate) }),
        ...(vendor !== undefined && { vendor }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
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
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await prisma.expense.delete({ where: { id } });

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
